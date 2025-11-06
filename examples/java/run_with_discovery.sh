#!/bin/bash
# Run script for SimpleMEIFileProviderWithDiscovery
# This script compiles and runs the Java example with auto-discovery

cd "$(dirname "$0")"

# Find dependencies
WEBSOCKET_JAR=$(find ~/.gradle/caches/modules-2/files-2.1/org.java-websocket/Java-WebSocket -name "*.jar" | grep -v sources | grep -v javadoc | head -1)
SLF4J_API=$(find ~/.gradle/caches/modules-2/files-2.1/org.slf4j/slf4j-api -name "*.jar" | grep -v sources | grep -v javadoc | head -1)
SLF4J_NOP=$(find ~/.gradle/caches/modules-2/files-2.1/org.slf4j/slf4j-nop -name "*.jar" | grep -v sources | grep -v javadoc | head -1)

if [ -z "$WEBSOCKET_JAR" ] || [ -z "$SLF4J_API" ]; then
    echo "Error: Required dependencies not found. Please run 'gradle build' first to download dependencies."
    exit 1
fi

# Compile
echo "Compiling Java files..."
mkdir -p build/classes/java/main
javac -d build/classes/java/main -cp "$WEBSOCKET_JAR" src/main/java/org/example/FlowScoreDiscovery.java src/main/java/org/example/SimpleMEIFileProviderWithDiscovery.java

if [ $? -ne 0 ]; then
    echo "Compilation failed"
    exit 1
fi

# Run
MEI_FILE="${1:-../Brahms_StringQuartet_Op51_No1.mei}"
echo "Running with MEI file: $MEI_FILE"
java -cp "build/classes/java/main:$WEBSOCKET_JAR:$SLF4J_API:$SLF4J_NOP" org.example.SimpleMEIFileProviderWithDiscovery "$MEI_FILE"

