package gstorage

import (
	"context"
	"crypto/ecdsa"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/gin-gonic/gin"
)

// Mock 0G Storage client interface for development
// In production, replace with actual 0G Storage SDK

// StorageClient represents a 0G Storage client
type StorageClient struct {
	privateKey *ecdsa.PrivateKey
	endpoint   string
	testnet    bool
}

// Server wraps the storage client for HTTP handlers
type Server struct {
	Client *StorageClient
}

// FileMetadata represents metadata for uploaded files
type FileMetadata struct {
	RootHash    string    `json:"root_hash"`
	FileName    string    `json:"file_name"`
	FileSize    int64     `json:"file_size"`
	UploadTime  time.Time `json:"upload_time"`
	ContentType string    `json:"content_type"`
}

// UploadResponse represents the response for file uploads
type UploadResponse struct {
	RootHash string `json:"root_hash"`
	FileName string `json:"file_name"`
	FileSize int64  `json:"file_size"`
	Message  string `json:"message"`
	Success  bool   `json:"success"`
	TxHash   string `json:"tx_hash,omitempty"`
}

// DownloadResponse represents file download metadata
type DownloadResponse struct {
	RootHash    string `json:"root_hash"`
	FileName    string `json:"file_name"`
	FileSize    int64  `json:"file_size"`
	ContentType string `json:"content_type"`
	Available   bool   `json:"available"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Success bool   `json:"success"`
}

// NewStorageClient creates a new 0G Storage client
func NewStorageClient(ctx context.Context, privateKeyHex string, testnet bool) (*StorageClient, error) {
	// Remove 0x prefix if present
	if len(privateKeyHex) >= 2 && privateKeyHex[:2] == "0x" {
		privateKeyHex = privateKeyHex[2:]
	}

	// Parse private key
	privateKeyBytes, err := hex.DecodeString(privateKeyHex)
	if err != nil {
		return nil, fmt.Errorf("invalid private key format: %v", err)
	}

	privateKey, err := crypto.ToECDSA(privateKeyBytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %v", err)
	}

	endpoint := "https://rpc-storage-testnet.0g.ai"
	if !testnet {
		endpoint = "https://rpc-storage.0g.ai"
	}

	return &StorageClient{
		privateKey: privateKey,
		endpoint:   endpoint,
		testnet:    testnet,
	}, nil
}

// Close closes the storage client connection
func (c *StorageClient) Close() {
	// Cleanup if needed
}

// uploadFile simulates uploading a file to 0G Storage
// In production, this would use the actual 0G Storage SDK
func (c *StorageClient) uploadFile(ctx context.Context, data []byte, filename string) (*FileMetadata, error) {
	// Generate a mock root hash (in production, this would be calculated by 0G Storage)
	hash := crypto.Keccak256Hash(data)
	rootHash := hash.Hex()

	// Detect content type
	contentType := http.DetectContentType(data)

	metadata := &FileMetadata{
		RootHash:    rootHash,
		FileName:    filename,
		FileSize:    int64(len(data)),
		UploadTime:  time.Now(),
		ContentType: contentType,
	}

	// In production, this would:
	// 1. Split file into chunks
	// 2. Calculate merkle tree
	// 3. Submit to 0G Storage network
	// 4. Wait for confirmation

	return metadata, nil
}

// downloadFile simulates downloading a file from 0G Storage
// In production, this would use the actual 0G Storage SDK
func (c *StorageClient) downloadFile(ctx context.Context, rootHash string) ([]byte, *FileMetadata, error) {
	// Mock implementation - in production this would retrieve from 0G Storage
	// For now, return an error indicating file not found
	return nil, nil, fmt.Errorf("file not found in 0G Storage network")
}

// getFileInfo retrieves file metadata from 0G Storage
func (c *StorageClient) getFileInfo(ctx context.Context, rootHash string) (*FileMetadata, error) {
	// Mock implementation - in production this would query 0G Storage
	return nil, fmt.Errorf("file metadata not found")
}

// HandleUploadFile handles file uploads to 0G Storage
func HandleUploadFile(server *Server) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()

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

		// Check file size (0G Storage has limits)
		maxSize := int64(100 * 1024 * 1024) // 100MB limit
		if int64(len(content)) > maxSize {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "file_too_large",
				Message: fmt.Sprintf("File size exceeds maximum limit of %d bytes", maxSize),
				Success: false,
			})
			return
		}

		// Upload to 0G Storage
		metadata, err := server.Client.uploadFile(ctx, content, header.Filename)
		if err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse{
				Error:   "upload_failed",
				Message: fmt.Sprintf("Failed to upload to 0G Storage: %v", err),
				Success: false,
			})
			return
		}

		response := UploadResponse{
			RootHash: metadata.RootHash,
			FileName: metadata.FileName,
			FileSize: metadata.FileSize,
			Message:  "File uploaded successfully to 0G Storage",
			Success:  true,
			TxHash:   "", // Would be populated with actual transaction hash
		}

		c.JSON(http.StatusOK, response)
	}
}

// HandleGetFile handles file downloads from 0G Storage
func HandleGetFile(server *Server) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()
		rootHash := c.Param("root_hash")

		if rootHash == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "hash_required",
				Message: "Root hash is required",
				Success: false,
			})
			return
		}

		// Validate hash format
		if len(rootHash) < 2 || rootHash[:2] != "0x" {
			rootHash = "0x" + rootHash
		}

		if !common.IsHexAddress(rootHash) && len(rootHash) != 66 {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "invalid_hash",
				Message: "Invalid root hash format",
				Success: false,
			})
			return
		}

		// Download from 0G Storage
		content, metadata, err := server.Client.downloadFile(ctx, rootHash)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "file_not_found",
				Message: fmt.Sprintf("Failed to download from 0G Storage: %v", err),
				Success: false,
			})
			return
		}

		// Set headers for file download
		c.Header("Content-Type", metadata.ContentType)
		c.Header("Content-Length", fmt.Sprintf("%d", len(content)))
		c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", metadata.FileName))
		c.Header("X-Root-Hash", metadata.RootHash)

		// Return file content
		c.Data(http.StatusOK, metadata.ContentType, content)
	}
}

// HandleGetFileInfo handles requests for file metadata
func HandleGetFileInfo(server *Server) gin.HandlerFunc {
	return func(c *gin.Context) {
		ctx := context.Background()
		rootHash := c.Param("root_hash")

		if rootHash == "" {
			c.JSON(http.StatusBadRequest, ErrorResponse{
				Error:   "hash_required",
				Message: "Root hash is required",
				Success: false,
			})
			return
		}

		// Get file info from 0G Storage
		metadata, err := server.Client.getFileInfo(ctx, rootHash)
		if err != nil {
			c.JSON(http.StatusNotFound, ErrorResponse{
				Error:   "file_not_found",
				Message: fmt.Sprintf("File metadata not found: %v", err),
				Success: false,
			})
			return
		}

		response := DownloadResponse{
			RootHash:    metadata.RootHash,
			FileName:    metadata.FileName,
			FileSize:    metadata.FileSize,
			ContentType: metadata.ContentType,
			Available:   true,
		}

		c.JSON(http.StatusOK, response)
	}
}

// HandleListFiles handles requests to list uploaded files
func HandleListFiles(server *Server) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Mock implementation - in production this would query user's files
		files := []FileMetadata{}

		response := map[string]interface{}{
			"files":   files,
			"count":   len(files),
			"success": true,
			"message": "Files retrieved successfully",
		}

		c.JSON(http.StatusOK, response)
	}
}

// HandleStorageStats handles requests for storage statistics
func HandleStorageStats(server *Server) gin.HandlerFunc {
	return func(c *gin.Context) {
		stats := map[string]interface{}{
			"network_status":    "connected",
			"available_storage": "unlimited",
			"used_storage":      "0 bytes",
			"file_count":        0,
			"testnet":           server.Client.testnet,
			"endpoint":          server.Client.endpoint,
		}

		c.JSON(http.StatusOK, stats)
	}
}
