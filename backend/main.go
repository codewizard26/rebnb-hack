// @title           0G Storage API Sandbox
// @version         1.0
// @description     Upload and download files using 0G Storage network. Click "Try it out" on any endpoint to test it.
// @host           localhost:8080
// @BasePath       /api/v1
// @schemes        http https

package main

import (
	"log"
	"os"

	"rebnb/rest"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("⚠️  No .env file found. Please create one with your PRIVATE_KEY")
		log.Println("📝 Example .env file content:")
		log.Println("PRIVATE_KEY=your_private_key_here")
	}

	privateKey := os.Getenv("PRIVATE_KEY")
	if privateKey == "" {
		log.Fatal("❌ PRIVATE_KEY environment variable is required. Please add it to .env file")
	}

	r := gin.New()
	rest.SetupRoutes(privateKey, r)

	port := ":8080"
	log.Printf("🚀 Server starting on http://localhost%s", port)
	log.Fatal(r.Run(port))
}
