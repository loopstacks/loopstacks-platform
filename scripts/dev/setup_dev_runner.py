#!/usr/bin/env python3
"""
Setup script for LoopStacks Development Runner

This script installs the required Python packages for the iTerm2 development runner.
"""

import subprocess
import sys


def run_command(cmd, description):
    """Run a shell command and handle errors"""
    print(f"📦 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"   ✓ Success")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ✗ Error: {e.stderr}")
        return False


def main():
    print("🚀 Setting up LoopStacks Development Runner")
    print("=" * 50)

    # Check Python version
    if sys.version_info < (3, 7):
        print("❌ Python 3.7+ is required")
        sys.exit(1)

    print(f"✓ Python {sys.version.split()[0]} detected")

    # Install iterm2 package
    success = run_command("pip3 install iterm2", "Installing iterm2 Python package")

    if not success:
        print("\n⚠️  If the above failed, try:")
        print("   pip3 install --user iterm2")
        print("   or")
        print("   python3 -m pip install iterm2")

    print("\n🎉 Setup complete!")
    print("\nNext steps:")
    print("1. Make sure iTerm2 Python API is enabled:")
    print("   iTerm2 → Preferences → General → Magic → Enable Python API")
    print("\n2. Run the development environment:")
    print("   python3 dev_runner.py --mode mock")
    print("   or")
    print("   python3 dev_runner.py --mode k8s")


if __name__ == "__main__":
    main()