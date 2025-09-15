#!/usr/bin/env python3
"""
LoopStacks Development Runner for iTerm2

This script creates an iTerm2 window with multiple panes to run different
components of the LoopStacks platform for development.

Usage:
    python3 dev_runner.py [--root-dir /path/to/project] [--mode mock|k8s]

Requirements:
    - iTerm2 with Python API enabled
    - iterm2 Python package: pip install iterm2
"""

import argparse
import asyncio
import os
import sys
import time
from pathlib import Path

try:
    import iterm2
except ImportError:
    print("Error: iterm2 package not found. Install with: pip install iterm2")
    sys.exit(1)


class LoopStacksRunner:
    def __init__(self, root_dir: str, mode: str = "mock"):
        self.root_dir = Path(root_dir).resolve()
        self.mode = mode
        self.panes = {}

        # Verify project directory
        if not (self.root_dir / "Makefile").exists():
            raise ValueError(f"Invalid project directory: {root_dir}")

    async def create_development_environment(self, connection):
        """Create iTerm2 window with development panes"""

        # Get the app
        app = await iterm2.async_get_app(connection)

        # Create new window
        window = await iterm2.Window.async_create(connection)
        await window.async_set_title(f"LoopStacks Development ({self.mode.upper()})")

        # Get the initial tab and session
        tab = window.current_tab
        session = tab.current_session

        print(f"Setting up LoopStacks development environment in {self.mode} mode...")

        # Setup panes based on mode
        if self.mode == "mock":
            await self._setup_mock_mode(tab, session)
        else:
            await self._setup_k8s_mode(tab, session)

        print("Development environment ready!")
        return window

    async def _setup_mock_mode(self, tab, session):
        """Setup panes for mock development mode"""

        # Pane 1 (top-left): Development Services
        await self._setup_pane(session, "Services", f"cd {self.root_dir} && make dev-services")

        # Split horizontally for Control Plane
        session = await session.async_split_pane(vertical=False)
        await asyncio.sleep(1)
        await self._setup_pane(session, "Control Plane", f"cd {self.root_dir} && sleep 10 && make run-control-plane")

        # Split vertically for Web Console
        session = await session.async_split_pane(vertical=True)
        await asyncio.sleep(1)
        await self._setup_pane(session, "Web Console", f"cd {self.root_dir} && sleep 15 && make run-console")

        # Go back to first pane and split for logs/commands
        session = tab.current_session.split_pane_sessions[0]
        session = await session.async_split_pane(vertical=True)
        await asyncio.sleep(1)
        await self._setup_pane(session, "Commands", f"cd {self.root_dir}")

    async def _setup_k8s_mode(self, tab, session):
        """Setup panes for Kubernetes development mode"""

        # Pane 1: Development Services + k3d
        await self._setup_pane(session, "Services", f"cd {self.root_dir} && make dev-services")

        # Split for Operator
        session = await session.async_split_pane(vertical=False)
        await asyncio.sleep(1)
        await self._setup_pane(session, "Operator", f"cd {self.root_dir} && sleep 10 && make run-operator")

        # Split for Control Plane
        session = await session.async_split_pane(vertical=True)
        await asyncio.sleep(1)
        await self._setup_pane(session, "Control Plane", f"cd {self.root_dir} && sleep 15 && make run-control-plane")

        # Go back and create another row
        first_session = tab.current_session.split_pane_sessions[0]
        session = await first_session.async_split_pane(vertical=True)
        await asyncio.sleep(1)
        await self._setup_pane(session, "Web Console", f"cd {self.root_dir} && sleep 20 && make run-console")

        # Split for logs/commands
        session = await session.async_split_pane(vertical=False)
        await asyncio.sleep(1)
        await self._setup_pane(session, "Commands", f"cd {self.root_dir}")

    async def _setup_pane(self, session, name: str, command: str):
        """Setup individual pane with name and command"""
        # Set pane title
        await session.async_set_name(name)

        # Send command
        await session.async_send_text(command + "\n")

        # Store reference
        self.panes[name] = session

        print(f"  ✓ {name} pane created")


async def main():
    parser = argparse.ArgumentParser(description="LoopStacks Development Runner for iTerm2")
    parser.add_argument("--root-dir", "-r",
                       default=os.getcwd(),
                       help="Root directory of the LoopStacks project")
    parser.add_argument("--mode", "-m",
                       choices=["mock", "k8s"],
                       default="mock",
                       help="Development mode: mock (no K8s) or k8s (full K8s)")

    args = parser.parse_args()

    # Validate root directory
    root_path = Path(args.root_dir).resolve()
    if not (root_path / "Makefile").exists():
        print(f"Error: {root_path} doesn't appear to be a LoopStacks project directory")
        print("Make sure you're in the right directory or use --root-dir")
        sys.exit(1)

    try:
        runner = LoopStacksRunner(args.root_dir, args.mode)

        # Connect to iTerm2
        connection = await iterm2.Connection.async_create()

        # Create development environment
        window = await runner.create_development_environment(connection)

        print(f"\n🚀 LoopStacks development environment started!")
        print(f"   Mode: {args.mode.upper()}")
        print(f"   Project: {root_path}")

        if args.mode == "mock":
            print(f"\n📋 Services will be available at:")
            print(f"   • Control Plane API: http://localhost:8080")
            print(f"   • Web Console: http://localhost:3000")
            print(f"   • Health Check: http://localhost:8080/health")
        else:
            print(f"\n📋 Services will be available at:")
            print(f"   • Operator: port 8081")
            print(f"   • Control Plane API: http://localhost:8080")
            print(f"   • Web Console: http://localhost:3000")

        print(f"\n⏱️  Wait a few moments for all services to start up...")
        print(f"💡 Use the 'Commands' pane to run additional make targets")

        # Keep the script running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            print("\n👋 Shutting down...")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())