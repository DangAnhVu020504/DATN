@REM Maven Wrapper for Windows
@REM This script downloads Maven if not present and runs it
@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set MAVEN_WRAPPER_JAR=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar

if exist "%MAVEN_WRAPPER_JAR%" goto runMaven

echo Downloading Maven Wrapper...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar' -OutFile '%MAVEN_WRAPPER_JAR%'}"

:runMaven
java -jar "%MAVEN_WRAPPER_JAR%" %*
