#!/usr/bin/env python3
"""
Task Collaboration Platform - Database Setup Script
Automatically creates PostgreSQL database from .env configuration
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from dotenv import load_dotenv

def load_env_config():
    """Load database configuration from .env file"""
    load_dotenv()
    
    config = {
        'user': os.getenv('PGUSER', 'postgres'),
        'password': os.getenv('PGPASSWORD', 'postgres'),
        'host': os.getenv('PGHOST', 'localhost'),
        'port': os.getenv('PGPORT', '5432'),
        'database': os.getenv('PGDATABASE', 'task_collaboration')
    }
    
    return config

def create_database():
    """Create the PostgreSQL database"""
    config = load_env_config()
    db_name = config['database']
    
    print(f"\n🔧 Task Collaboration Platform - Database Setup")
    print(f"=" * 50)
    print(f"Host: {config['host']}:{config['port']}")
    print(f"User: {config['user']}")
    print(f"Database: {db_name}")
    print(f"=" * 50)
    
    try:
        # Connect to PostgreSQL server (default 'postgres' database)
        print(f"\n📡 Connecting to PostgreSQL server...")
        conn = psycopg2.connect(
            user=config['user'],
            password=config['password'],
            host=config['host'],
            port=config['port'],
            database='postgres'
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (db_name,)
        )
        exists = cursor.fetchone()
        
        if exists:
            print(f"\n⚠️  Database '{db_name}' already exists!")
            response = input("Do you want to drop and recreate it? (yes/no): ").lower()
            
            if response in ['yes', 'y']:
                print(f"\n🗑️  Dropping database '{db_name}'...")
                cursor.execute(f'DROP DATABASE "{db_name}"')
                print(f"✅ Database dropped successfully!")
            else:
                print(f"\n✅ Using existing database '{db_name}'")
                cursor.close()
                conn.close()
                print("\n🎉 Setup complete! Run: npm run prisma:migrate")
                return True
        
        # Create database
        print(f"\n🔨 Creating database '{db_name}'...")
        cursor.execute(f'CREATE DATABASE "{db_name}"')
        print(f"✅ Database '{db_name}' created successfully!")
        
        cursor.close()
        conn.close()
        
        print(f"\n🎉 Database setup complete!")
        print(f"\n📝 Next steps:")
        print(f"   1. Run: npm run prisma:migrate")
        print(f"   2. Run: npm run dev")
        print(f"\n")
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Connection Error: {e}")
        print(f"\n💡 Troubleshooting:")
        print(f"   • Ensure PostgreSQL is running")
        print(f"   • Check username/password in .env file")
        print(f"   • Verify host and port settings")
        return False
        
    except psycopg2.Error as e:
        print(f"\n❌ Database Error: {e}")
        return False
        
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}")
        return False

if __name__ == "__main__":
    print("\n" + "="*50)
    print("  Task Collaboration Platform")
    print("  Database Auto-Setup")
    print("="*50)
    
    # Check if psycopg2 is installed
    try:
        import psycopg2
    except ImportError:
        print("\n❌ Error: psycopg2 is not installed")
        print("\n📦 Install it with: pip install psycopg2-binary python-dotenv")
        sys.exit(1)
    
    # Check if .env file exists
    if not os.path.exists('.env'):
        print("\n❌ Error: .env file not found")
        print("\n💡 Create a .env file with your PostgreSQL credentials")
        sys.exit(1)
    
    # Create database
    success = create_database()
    sys.exit(0 if success else 1)
