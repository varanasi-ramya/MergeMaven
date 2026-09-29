from setuptools import setup, find_packages

setup(
    name="mergeguard",
    version="0.1.0",
    description="Bayesian Pull Request Conflict Predictor",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "Flask>=2.3",
        "PyGithub>=2.1",
        "GitPython>=3.1",
        "pyAgrum>=1.13",
        "pandas",
        "numpy",
        "SQLAlchemy>=2.0",
        "matplotlib",
        "seaborn",
        "click>=8.1",
    ],
    entry_points={
        "console_scripts": [
            "mergeguard=cli:main",
        ],
    },
    python_requires=">=3.10",
)