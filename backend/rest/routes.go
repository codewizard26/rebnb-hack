package rest

import (
	"context"
	"log"
	"rebnb/db"
	gstorage "rebnb/rest/handlers/0g-storage"
	"rebnb/rest/handlers/ipfs"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(privateKey string, r *gin.Engine) {
	ctx := context.Background()

	// Initialize 0G Storage client
	storageClient, err := gstorage.NewStorageClient(ctx, privateKey, true)
	if err != nil {
		log.Fatalf("Failed to initialize storage client: %v", err)
	}
	defer storageClient.Close()

	server := &gstorage.Server{Client: storageClient}

	// Initialize IPFS client
	ipfsClient := ipfs.NewIPFSClient()

	// Initialize ClickHouse client
	_, err = db.NewClient(nil) // Uses environment variables
	if err != nil {
		log.Printf("⚠️  Failed to initialize ClickHouse client: %v", err)
		log.Println("ClickHouse endpoints will be disabled")
	}

	// Initialize Gin router
	gin.SetMode(gin.ReleaseMode)
	r.Use(gin.Recovery())
	r.Use(gin.LoggerWithConfig(gin.LoggerConfig{
		SkipPaths: []string{"/swagger/*"},
	}))

	// CORS middleware for CodeSandbox
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	v1 := r.Group("/api/v1")
	{
		// 0G Storage endpoints
		storage := v1.Group("/storage")
		{
			storage.POST("/upload", gstorage.HandleUploadFile(server))
			storage.GET("/download/:root_hash", gstorage.HandleGetFile(server))
			storage.GET("/info/:root_hash", gstorage.HandleGetFileInfo(server))
			storage.GET("/list", gstorage.HandleListFiles(server))
			storage.GET("/stats", gstorage.HandleStorageStats(server))
		}

		// IPFS endpoints
		ipfsGroup := v1.Group("/ipfs")
		{
			ipfsGroup.POST("/upload", ipfs.HandleIPFSUpload(ipfsClient))
			ipfsGroup.GET("/:ipfs_hash", ipfs.HandleIPFSGet(ipfsClient))
			ipfsGroup.GET("/:ipfs_hash/info", ipfs.HandleIPFSInfo(ipfsClient))
			ipfsGroup.GET("/list", ipfs.HandleIPFSList(ipfsClient))
		}

		// Legacy endpoints for backward compatibility
		v1.POST("/upload", gstorage.HandleUploadFile(server))
		v1.GET("/download/:root_hash", gstorage.HandleGetFile(server))
	}
}
