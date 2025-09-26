package db

import (
	"context"
	"fmt"
	"strings"
)

// QueryResult represents a query result with metadata
type QueryResult struct {
	Columns []string                 `json:"columns"`
	Rows    []map[string]interface{} `json:"rows"`
	Count   int                      `json:"count"`
}

// InsertResult represents an insert operation result
type InsertResult struct {
	RowsAffected int64 `json:"rows_affected"`
	Error        error `json:"error,omitempty"`
}

// Query executes a SELECT query and returns structured results
func (c *Client) Query(ctx context.Context, query string, args ...interface{}) (*QueryResult, error) {
	rows, err := c.db.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query execution failed: %w", err)
	}
	defer rows.Close()

	// Get column information
	columns := rows.Columns()
	columnTypes := rows.ColumnTypes()

	result := &QueryResult{
		Columns: make([]string, len(columns)),
		Rows:    make([]map[string]interface{}, 0),
	}

	// Copy column names
	copy(result.Columns, columns)

	// Process rows
	for rows.Next() {
		// Create slice to hold row values
		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))

		for i := range values {
			valuePtrs[i] = &values[i]
		}

		// Scan row values
		if err := rows.Scan(valuePtrs...); err != nil {
			return nil, fmt.Errorf("row scan failed: %w", err)
		}

		// Create row map
		row := make(map[string]interface{})
		for i, col := range columns {
			// Handle different ClickHouse types
			val := values[i]
			if val != nil {
				// Convert based on column type if needed
				colType := columnTypes[i].DatabaseTypeName()
				row[col] = convertClickHouseValue(val, colType)
			} else {
				row[col] = nil
			}
		}

		result.Rows = append(result.Rows, row)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration failed: %w", err)
	}

	result.Count = len(result.Rows)
	return result, nil
}

// QueryRow executes a query that returns a single row
func (c *Client) QueryRow(ctx context.Context, query string, args ...interface{}) map[string]interface{} {
	result, err := c.Query(ctx, query, args...)
	if err != nil || len(result.Rows) == 0 {
		return nil
	}
	return result.Rows[0]
}

// Exec executes a non-SELECT query (INSERT, UPDATE, DELETE, DDL)
func (c *Client) Exec(ctx context.Context, query string, args ...interface{}) error {
	return c.db.Exec(ctx, query, args...)
}

// Insert performs a batch insert operation
func (c *Client) Insert(ctx context.Context, table string, columns []string, rows [][]interface{}) (*InsertResult, error) {
	if len(columns) == 0 || len(rows) == 0 {
		return &InsertResult{RowsAffected: 0}, nil
	}

	// Build INSERT query
	placeholders := make([]string, len(columns))
	for i := range placeholders {
		placeholders[i] = "?"
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
		table,
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "))

	// Prepare batch
	batch, err := c.db.PrepareBatch(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to prepare batch: %w", err)
	}

	// Add rows to batch
	for _, row := range rows {
		if len(row) != len(columns) {
			return nil, fmt.Errorf("row has %d values but expected %d columns", len(row), len(columns))
		}

		if err := batch.Append(row...); err != nil {
			return nil, fmt.Errorf("failed to append row to batch: %w", err)
		}
	}

	// Execute batch
	if err := batch.Send(); err != nil {
		return &InsertResult{Error: fmt.Errorf("batch send failed: %w", err)}, err
	}

	return &InsertResult{RowsAffected: int64(len(rows))}, nil
}

// CreateTable creates a table with the given schema
func (c *Client) CreateTable(ctx context.Context, tableName string, schema string) error {
	query := fmt.Sprintf("CREATE TABLE IF NOT EXISTS %s (%s)", tableName, schema)
	return c.Exec(ctx, query)
}

// DropTable drops a table
func (c *Client) DropTable(ctx context.Context, tableName string) error {
	query := fmt.Sprintf("DROP TABLE IF EXISTS %s", tableName)
	return c.Exec(ctx, query)
}

// TableExists checks if a table exists
func (c *Client) TableExists(ctx context.Context, tableName string) (bool, error) {
	query := "SELECT count() FROM system.tables WHERE database = currentDatabase() AND name = ?"

	var count uint64
	if err := c.db.QueryRow(ctx, query, tableName).Scan(&count); err != nil {
		return false, fmt.Errorf("failed to check table existence: %w", err)
	}

	return count > 0, nil
}

// GetTables returns a list of all tables in the current database
func (c *Client) GetTables(ctx context.Context) ([]string, error) {
	query := "SELECT name FROM system.tables WHERE database = currentDatabase() ORDER BY name"

	rows, err := c.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to get tables: %w", err)
	}
	defer rows.Close()

	var tables []string
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			return nil, fmt.Errorf("failed to scan table name: %w", err)
		}
		tables = append(tables, tableName)
	}

	return tables, nil
}

// GetTableSchema returns the schema of a table
func (c *Client) GetTableSchema(ctx context.Context, tableName string) ([]map[string]interface{}, error) {
	query := `SELECT name, type, default_kind, default_expression, comment 
			  FROM system.columns 
			  WHERE database = currentDatabase() AND table = ? 
			  ORDER BY position`

	result, err := c.Query(ctx, query, tableName)
	if err != nil {
		return nil, fmt.Errorf("failed to get table schema: %w", err)
	}

	return result.Rows, nil
}

// OptimizeTable optimizes a table (ClickHouse specific)
func (c *Client) OptimizeTable(ctx context.Context, tableName string) error {
	query := fmt.Sprintf("OPTIMIZE TABLE %s", tableName)
	return c.Exec(ctx, query)
}

// convertClickHouseValue converts ClickHouse values to appropriate Go types
func convertClickHouseValue(val interface{}, colType string) interface{} {
	// Handle common ClickHouse type conversions
	switch colType {
	case "DateTime", "DateTime64":
		// ClickHouse DateTime values are usually already time.Time
		return val
	case "Date":
		// ClickHouse Date values are usually already time.Time
		return val
	case "UUID":
		// UUID values are usually strings
		return val
	default:
		// For most other types, return as-is
		return val
	}
}
