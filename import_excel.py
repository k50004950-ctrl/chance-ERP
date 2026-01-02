# -*- coding: utf-8 -*-
import pandas as pd
import sqlite3
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def import_excel_to_db():
    # Find the Excel file
    files = [f for f in os.listdir('.') if f.endswith('.xlsx')]
    if not files:
        print("No Excel file found!")
        return

    excel_file = files[0]
    print(f"Reading file: {excel_file}")

    # Read Excel file
    df = pd.read_excel(excel_file)
    
    # The first row contains the actual headers
    df.columns = df.iloc[0]
    df = df[1:]  # Remove the header row from data
    
    # Reset index
    df = df.reset_index(drop=True)
    
    # Rename columns to English
    df.columns = ['month', 'barcode', 'product_name', 'quantity', 'consumer_price', 'purchase_price']
    
    # Clean data
    df = df.dropna(subset=['barcode', 'product_name'])  # Remove rows without barcode or product name
    df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce').fillna(0).astype(int)
    df['consumer_price'] = pd.to_numeric(df['consumer_price'], errors='coerce').fillna(0).astype(int)
    df['purchase_price'] = pd.to_numeric(df['purchase_price'], errors='coerce').fillna(0).astype(int)
    df['month'] = df['month'].fillna('').astype(str)
    
    print(f"\nProcessed {len(df)} rows of data")
    print("\nFirst 5 rows:")
    print(df.head().to_string())
    
    # Connect to SQLite database (will be created by Electron app)
    # This script is for reference - the actual import will be done through the Electron app
    print("\n" + "="*80)
    print("DATA READY FOR IMPORT")
    print("="*80)
    print(f"Total products to import: {len(df)}")
    print(f"Total quantity: {df['quantity'].sum()}")
    print(f"Total value (consumer price): ₩{df['consumer_price'].sum():,}")
    print(f"Total value (purchase price): ₩{df['purchase_price'].sum():,}")
    
    # Save to CSV for easy import
    output_file = 'products_import.csv'
    df.to_csv(output_file, index=False, encoding='utf-8-sig')
    print(f"\nData exported to: {output_file}")
    print("You can now import this file through the ERP application.")

if __name__ == "__main__":
    import_excel_to_db()

