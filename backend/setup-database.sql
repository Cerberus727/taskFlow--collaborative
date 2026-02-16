-- Task Collaboration Platform - Database Setup
-- This SQL file is for manual database creation if needed
-- For automatic setup, use: python setup-database.py

-- Drop database if exists (WARNING: This will delete all data!)
DROP DATABASE IF EXISTS task_collaboration;

-- Create the database
CREATE DATABASE task_collaboration;

-- Grant privileges (adjust username if needed)
GRANT ALL PRIVILEGES ON DATABASE task_collaboration TO postgres;
