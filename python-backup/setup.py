# setup.py

from setuptools import setup, find_packages

setup(
    name="healthcare_insurance_analyzer",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "numpy>=1.20.0",
        "pandas>=1.3.0",
        "matplotlib>=3.4.0",
        "seaborn>=0.11.0",
        "plotly>=5.3.0",
        "scikit-learn>=1.0.0",
        "openpyxl>=3.0.0",
        "PyPDF2>=2.0.0",
        "tabula-py>=2.3.0",
        "pdfplumber>=0.7.0",
        "streamlit>=1.8.0",
        "fpdf>=1.7.2",
        "openai>=0.27.0",
    ],
    author="BrainSAIT-LTD",
    author_email="contact@brainsait.com",
    description="Healthcare Insurance Data Analysis System",
    keywords="healthcare, insurance, data analysis, streamlit",
    url="https://github.com/BrainSAIT-LTD/Healthcare-Insurance-Data-Analysis-System",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Healthcare Industry",
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: GNU General Public License v3 (GPLv3)",
    ],
    python_requires=">=3.7",
)
