# Codium CLI

A command-line tool to initialize and push projects to the Codium platform, inspired by Git.

## Installation

To use the Codium CLI, you must install it **globally** from npm.

```bash
npm install -g @manasrose/codium
```

## Usage

Before you begin, you need to log in to your Codium account.

```bash
codium login
```

Links your local directory to a new repository on the Codium platform.

```bash
codium init
```

Stages a file for your next commit.

```bash
codium add <filename>
```

Creates a local commit record with a message.

```bash
codium commit "Your commit message"
```

Uploads your local commits and files to the remote repository.

```bash
codium push
```
