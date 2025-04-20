# src/ui/app.py

import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import sys
import os
from datetime import datetime

# Add the src directory to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import other modules
from data_extraction.excel_extractor import ExcelExtractor
from data_extraction.pdf_extractor import PDFExtractor
from data_processing.data_processor import DataProcessor
from analysis.rejection_analyzer import RejectionAnalyzer
from analysis.trend_analyzer import TrendAnalyzer
from visualization.visualization_utils import create_visualizations

# Set page configuration
st.set_page_config(
    page_title="Healthcare Insurance Data Analyzer",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main {
        padding: 2rem;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 2px;
    }
    .stTabs [data-baseweb="tab"] {
        padding: 10px 20px;
        border-radius: 4px 4px 0px 0px;
    }
    .report-section {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 5px;
        margin-bottom: 20px;
    }
    .footer {
        margin-top: 50px;
        text-align: center;
        font-size: 12px;
        color: #888;
    }
    .highlight {
        background-color: #e7f3fe;
        border-left: 6px solid #2196F3;
        padding: 10px;
        margin: 15px 0;
    }
    .metrics-container {
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
    }
    .metric-card {
        background-color: white;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        padding: 15px;
        margin: 10px 0;
        width: 48%;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state variables if they don't exist
if 'df' not in st.session_state:
    st.session_state.df = None
if 'uploaded_files' not in st.session_state:
    st.session_state.uploaded_files = []
if 'extracted_data' not in st.session_state:
    st.session_state.extracted_data = {}
if 'analysis_results' not in st.session_state:
    st.session_state.analysis_results = {}
if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []
if 'llm_report' not in st.session_state:
    st.session_state.llm_report = ""
if 'column_mapping' not in st.session_state:
    st.session_state.column_mapping = {}

def main():
    # Sidebar for navigation
    st.sidebar.title("Healthcare Insurance Data Analyzer")
    st.sidebar.image("https://img.icons8.com/color/96/000000/health-insurance.png", width=100)
    
    # Navigation menu
    page = st.sidebar.radio("Navigation", [
        "Upload Data", 
        "Data Exploration", 
        "Analysis", 
        "Visualization", 
        "Reports", 
        "Chat with Data", 
        "Settings"
    ])
    
    # API key input in sidebar under settings collapsible section
    with st.sidebar.expander("API Settings"):
        api_key = st.text_input("Enter OpenAI API Key", type="password")
        if api_key:
            st.success("API Key set!")
    
    if page == "Upload Data":
        display_upload_page()
    elif page == "Data Exploration":
        display_exploration_page()
    elif page == "Analysis":
        display_analysis_page()
    elif page == "Visualization":
        display_visualization_page()
    elif page == "Reports":
        display_reports_page(api_key)
    elif page == "Chat with Data":
        display_chat_page(api_key)
    elif page == "Settings":
        display_settings_page(api_key)

def display_upload_page():
    st.title("Upload Healthcare Insurance Data")
    
    uploaded_files = st.file_uploader("Upload Excel or PDF files", type=["xlsx", "xls", "csv", "pdf"], accept_multiple_files=True)
    
    if uploaded_files:
        st.session_state.uploaded_files = uploaded_files
        
        for file in uploaded_files:
            st.write(f"Uploaded: {file.name}")
            
            if file.name.endswith(('.xlsx', '.xls', '.csv')):
                # Process Excel file
                with st.spinner(f"Processing {file.name}..."):
                    excel_extractor = ExcelExtractor()
                    df = excel_extractor.load_file(file)
                    
                    if df is not None:
                        st.session_state.df = df
                        st.session_state.extracted_data[file.name] = {
                            'type': 'excel',
                            'data': df
                        }
                        st.success(f"Successfully extracted data from {file.name} with {df.shape[0]} rows and {df.shape[1]} columns")
            
            elif file.name.endswith('.pdf'):
                # Process PDF file
                with st.spinner(f"Processing {file.name}..."):
                    pdf_extractor = PDFExtractor()
                    text = pdf_extractor.load_file(file)
                    tables = pdf_extractor.extract_tables()
                    
                    if text or tables:
                        st.session_state.extracted_data[file.name] = {
                            'type': 'pdf',
                            'text': text,
                            'tables': tables
                        }
                        
                        if tables:
                            st.success(f"Successfully extracted {len(tables)} tables from {file.name}")
                            
                            # Display the first table as a preview
                            if len(tables) > 0:
                                st.write("Preview of first table:")
                                st.dataframe(tables[0])
                                
                                # Option to convert PDF table to main dataframe
                                if st.button(f"Use first table from {file.name} as main data"):
                                    st.session_state.df = tables[0]
                                    st.success("Table set as main data for analysis")
                        else:
                            st.warning(f"No tables found in {file.name}, but text was extracted")
        
        # If we have a dataframe, show column mapping options
        if st.session_state.df is not None:
            st.subheader("Column Mapping")
            st.write("Please identify the key columns in your data for analysis:")
            
            cols = st.session_state.df.columns.tolist()
            
            col1, col2 = st.columns(2)
            
            with col1:
                status_col = st.selectbox("Status Column (contains Approved/Rejected)", 
                                        options=[""] + cols, 
                                        format_func=lambda x: f"{x}" if x else "Select a column")
                
                amount_col = st.selectbox("Amount Column", 
                                        options=[""] + cols, 
                                        format_func=lambda x: f"{x}" if x else "Select a column")
            
            with col2:
                date_col = st.selectbox("Date Column", 
                                      options=[""] + cols, 
                                      format_func=lambda x: f"{x}" if x else "Select a column")
                
                category_col = st.selectbox("Category Column (for grouping)", 
                                          options=[""] + cols, 
                                          format_func=lambda x: f"{x}" if x else "Select a column")
            
            if st.button("Save Column Mapping"):
                # Create mapping
                mapping = {
                    'status_col': status_col if status_col else None,
                    'amount_col': amount_col if amount_col else None,
                    'date_col': date_col if date_col else None,
                    'category_col': category_col if category_col else None
                }
                
                st.session_state.column_mapping = mapping
                st.success("Column mapping saved!")
                st.write("You can now proceed to Data Exploration and Analysis")

def display_exploration_page():
    st.title("Data Exploration")
    
    if st.session_state.df is None:
        st.warning("No data uploaded yet. Please go to the Upload Data page first.")
        return
    
    df = st.session_state.df
    
    # Basic information about the data
    st.subheader("Data Overview")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Rows", df.shape[0])
    with col2:
        st.metric("Columns", df.shape[1])
    with col3:
        st.metric("Missing Values", df.isnull().sum().sum())
    
    # Display a sample of the data
    st.subheader("Data Sample")
    st.dataframe(df.head(10))
    
    # Data cleaning
    st.subheader("Data Cleaning")
    if st.button("Clean Data"):
        processor = DataProcessor(df)
        clean_df = processor.clean_data()
        st.session_state.df = clean_df
        st.success("Data cleaned successfully!")
        st.dataframe(clean_df.head(10))
    
    # Display column information
    st.write("Column Information:")
    col_info = pd.DataFrame({
        'Column': df.columns,
        'Type': df.dtypes,
        'Missing': df.isnull().sum(),
        'Missing %': (df.isnull().sum() / len(df) * 100).round(2),
        'Unique Values': df.nunique()
    })
    st.dataframe(col_info)
    
    # Display summary statistics for numeric columns
    numeric_cols = df.select_dtypes(include=['number']).columns.tolist()
    if numeric_cols:
        st.write("Summary Statistics for Numeric Columns:")
        st.dataframe(df[numeric_cols].describe())
    
    # Display unique values for categorical columns (with limit)
    categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
    if categorical_cols:
        st.write("Categorical Columns:")
        
        # Let user select a column to view unique values
        selected_cat_col = st.selectbox("Select column to view unique values", categorical_cols)
        unique_values = df[selected_cat_col].value_counts().head(20)  # Limit to top 20
        
        st.write(f"Top values for {selected_cat_col}:")
        st.dataframe(unique_values)
        
        # Show distribution plot
        fig = px.bar(unique_values, title=f"Distribution of {selected_cat_col}")
        st.plotly_chart(fig)

def display_analysis_page():
    # Implement the analysis page functionality
    st.title("Data Analysis")
    
    # Rest of the analysis page code would go here
    # (Implement based on your RejectionAnalyzer and TrendAnalyzer classes)

def display_visualization_page():
    # Implement the visualization page functionality
    st.title("Data Visualization")
    
    # Rest of the visualization page code would go here

def display_reports_page(api_key):
    # Implement the reports page functionality
    st.title("Analysis Reports")
    
    # Rest of the reports page code would go here

def display_chat_page(api_key):
    # Implement the chat page functionality
    st.title("Chat with Your Data")
    
    # Rest of the chat page code would go here

def display_settings_page(api_key):
    # Implement the settings page functionality
    st.title("Settings")
    
    # Rest of the settings page code would go here

if __name__ == "__main__":
    main()
