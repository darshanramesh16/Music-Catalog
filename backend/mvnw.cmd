@echo off
setlocal
set MAVEN_VERSION=3.9.9
set MAVEN_DIR=%~dp0.mvn\wrapper\apache-maven-%MAVEN_VERSION%
if not exist "%MAVEN_DIR%\bin\mvn.cmd" (
  echo Downloading Maven %MAVEN_VERSION% for the first run...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing 'https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile '%~dp0.mvn\wrapper\maven.zip'; Expand-Archive -Force '%~dp0.mvn\wrapper\maven.zip' '%~dp0.mvn\wrapper'; Remove-Item '%~dp0.mvn\wrapper\maven.zip'"
)
call "%MAVEN_DIR%\bin\mvn.cmd" %*
