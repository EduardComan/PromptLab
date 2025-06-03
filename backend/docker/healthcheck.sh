#!/bin/sh

# Check if the API is responding
wget --spider -q http://localhost:3001/api/health || exit 1

# All checks passed
exit 0 