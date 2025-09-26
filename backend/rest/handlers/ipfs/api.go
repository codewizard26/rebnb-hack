package ipfs

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	shell "github.com/ipfs/go-ipfs-api"
)

// PinataConfig holds Pinata API credentials
type PinataConfig struct {
	APIKey     string
	APISecret  string
	JWT        string
	GatewayURL string
}

// IPFSClient wraps the Pinata client
type IPFSClient struct {
	config     *PinataConfig
	httpClient *http.Client
	shell      *shell.Shell
}

// NewIPFSClient creates a new IPFS client using Pinata
func NewIPFSClient() *IPFSClient {
	// Get credentials from environment variables
	apiKey := os.Getenv("PINATA_API_KEY")
	apiSecret := os.Getenv("PINATA_API_SECRET")
	jwt := os.Getenv("PINATA_JWT")
	gatewayURL := os.Getenv("PINATA_GATEWAY_URL")

	// Fallback to defaults if env vars not set (for development)
	if apiKey == "" {
		apiKey = "32c535dd05ca5e187cce"
	}
	if apiSecret == "" {
		apiSecret = "e95a0519450ce92ca895f170818955eaa3464eb5516d9ee7724680d429063172"
	}
	if jwt == "" {
		jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4ZDlhMDVhNS04ZmUxLTRiYmUtYTJhMC05NGViNzIyOTI4ZTUiLCJlbWFpbCI6ImhlbGxvQHN1bWl0ZGhpbWFuLmluIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjMyYzUzNWRkMDVjYTVlMTg3Y2NlIiwic2NvcGVkS2V5U2VjcmV0IjoiZTk1YTA1MTk0NTBjZTkyY2E4OTVmMTcwODE4OTU1ZWFhMzQ2NGViNTUxNmQ5ZWU3NzI0NjgwZDQyOTA2MzE3MiIsImV4cCI6MTc5MDQzMzM5Mn0.Ve8HRmHSsIoLI7qlZqTD6z8C33yhiKBQ7yMm0IqTGE0"
	}
	if gatewayURL == "" {
		gatewayURL = "https://pink-improved-swift-480.mypinata.cloud/ipfs/"
	}

	config := &PinataConfig{
		APIKey:     apiKey,
		APISecret:  apiSecret,
		JWT:        jwt,
		GatewayURL: gatewayURL,
	}

	return &IPFSClient{
		config:     config,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// uploadToPinata uploads a file to Pinata using their v3 API
func (c *IPFSClient) uploadToPinata(fileContent []byte, filename string) (*PinataUploadResponse, error) {
	// Create multipart form
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add file part
	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return nil, fmt.Errorf("failed to create form file: %v", err)
	}

	_, err = part.Write(fileContent)
	if err != nil {
		return nil, fmt.Errorf("failed to write file content: %v", err)
	}

	// Add network field (required for v3 API)
	writer.WriteField("network", "public")

	writer.Close()

	// Create request using v3 API endpoint
	req, err := http.NewRequest("POST", "https://uploads.pinata.cloud/v3/files", &buf)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+c.config.JWT)

	// Send request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// Read response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("pinata API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// Parse response (v3 API has different response format)
	var v3Resp PinataV3Response
	err = json.Unmarshal(respBody, &v3Resp)
	if err != nil {
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	// Convert v3 response to legacy format for compatibility
	pinataResp := &PinataUploadResponse{
		IpfsHash:  v3Resp.Data.CID,
		PinSize:   v3Resp.Data.Size,
		Timestamp: v3Resp.Data.CreatedAt,
	}

	return pinataResp, nil
}

// PinataUploadResponse represents Pinata's upload response (legacy format)
type PinataUploadResponse struct {
	IpfsHash  string `json:"IpfsHash"`
	PinSize   int    `json:"PinSize"`
	Timestamp string `json:"Timestamp"`
}

// PinataV3Response represents Pinata's v3 API response format
type PinataV3Response struct {
	Data struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		CID       string `json:"cid"`
		Size      int    `json:"size"`
		CreatedAt string `json:"created_at"`
		MimeType  string `json:"mime_type"`
	} `json:"data"`
}

// UploadResponse represents the response for file uploads
type UploadResponse struct {
	Hash     string `json:"hash"`
	Name     string `json:"name"`
	Size     string `json:"size"`
	Message  string `json:"message"`
	Uploaded bool   `json:"uploaded"`
}

// FileInfo represents IPFS file information
type FileInfo struct {
	Hash        string    `json:"hash"`
	Size        int64     `json:"size"`
	Type        string    `json:"type"`
	Name        string    `json:"name"`
	RetrievedAt time.Time `json:"retrieved_at"`
	Available   bool      `json:"available"`
	PinStatus   string    `json:"pin_status"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Success bool   `json:"success"`
}

// HandleIPFSUpload handles file uploads to IPFS
func HandleIPFSUpload(client *IPFSClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get file from form
		file, header, err := c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "file_required",
				Message: "File is required",
				Success: false,
			})
			return
		}
		defer file.Close()

		// Read file content
		content, err := io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "file_read_error",
				Message: "Failed to read file content",
				Success: false,
			})
			return
		}

		// Upload to Pinata
		pinataResp, err := client.uploadToPinata(content, header.Filename)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "ipfs_upload_error",
				Message: fmt.Sprintf("Failed to upload to IPFS: %v", err),
				Success: false,
			})
			return
		}

		hash := pinataResp.IpfsHash
		sizeStr := fmt.Sprintf("%d", pinataResp.PinSize)

		response := UploadResponse{
			Hash:     hash,
			Name:     header.Filename,
			Size:     sizeStr,
			Message:  "File uploaded successfully to IPFS",
			Uploaded: true,
		}

		c.JSON(http.StatusOK, response)
	}
}

// HandleIPFSGet retrieves files from IPFS
func HandleIPFSGet(client *IPFSClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		hash := c.Param("ipfs_hash")
		if hash == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "hash_required",
				Message: "IPFS hash is required",
				Success: false,
			})
			return
		}

		// Get file from IPFS via gateway
		gatewayURL := fmt.Sprintf("https://ipfs.io/ipfs/%s", hash)
		resp, err := client.httpClient.Get(gatewayURL)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "file_not_found",
				Message: fmt.Sprintf("Failed to retrieve file from IPFS: %v", err),
				Success: false,
			})
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "file_not_found",
				Message: fmt.Sprintf("File not found on IPFS (status %d)", resp.StatusCode),
				Success: false,
			})
			return
		}

		// Read content
		content, err := io.ReadAll(resp.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "file_read_error",
				Message: "Failed to read file from IPFS",
				Success: false,
			})
			return
		}

		// Try to determine content type
		contentType := http.DetectContentType(content)

		// Set headers for file download
		c.Header("Content-Type", contentType)
		c.Header("Content-Length", fmt.Sprintf("%d", len(content)))
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", hash))

		// Return file content
		c.Data(http.StatusOK, contentType, content)
	}
}

// HandleIPFSInfo retrieves information about an IPFS file
func HandleIPFSInfo(client *IPFSClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		hash := c.Param("ipfs_hash")
		if hash == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "hash_required",
				Message: "IPFS hash is required",
				Success: false,
			})
			return
		}

		// Get object statistics
		stat, err := client.shell.ObjectStat(hash)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "file_not_found",
				Message: fmt.Sprintf("Failed to get file info: %v", err),
				Success: false,
			})
			return
		}

		// Check if file is pinned
		pinned := false
		pins, err := client.shell.Pins()
		if err == nil {
			for pin := range pins {
				if pin == hash {
					pinned = true
					break
				}
			}
		}

		pinStatus := "unpinned"
		if pinned {
			pinStatus = "pinned"
		}

		// Try to get additional info
		available := true
		_, err = client.shell.Cat(hash)
		if err != nil {
			available = false
		}

		info := FileInfo{
			Hash:        hash,
			Size:        int64(stat.CumulativeSize),
			Type:        "file", // IPFS doesn't provide MIME type in ObjectStat
			Name:        hash,   // Use hash as name if no filename available
			RetrievedAt: time.Now(),
			Available:   available,
			PinStatus:   pinStatus,
		}

		c.JSON(http.StatusOK, info)
	}
}

// HandleIPFSList lists pinned files (optional utility endpoint)
func HandleIPFSList(client *IPFSClient) gin.HandlerFunc {
	return func(c *gin.Context) {
		pins, err := client.shell.Pins()
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "pins_error",
				Message: fmt.Sprintf("Failed to list pinned files: %v", err),
				Success: false,
			})
			return
		}

		var files []string
		for pin := range pins {
			files = append(files, pin)
		}

		response := map[string]interface{}{
			"pinned_files": files,
			"count":        len(files),
			"success":      true,
		}

		c.JSON(http.StatusOK, response)
	}
}
