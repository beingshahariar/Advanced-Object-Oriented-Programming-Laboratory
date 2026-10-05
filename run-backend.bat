@echo off
setlocal EnableExtensions
rem Prevent an inherited DEBUG variable from enabling Spring Boot's verbose debug logging.
set "DEBUG="
set "PROJECT_ROOT=%~dp0"

if not defined JAVA_HOME (
  for /f "delims=" %%J in ('dir /b /ad "%ProgramFiles%\Java\jdk-*" 2^>nul') do (
    set "JAVA_HOME=%ProgramFiles%\Java\%%J"
    goto java_found
  )
)
if not defined JAVA_HOME (
  for /f "delims=" %%J in ('dir /b /ad "%ProgramFiles%\Eclipse Adoptium\jdk-*" 2^>nul') do (
    set "JAVA_HOME=%ProgramFiles%\Eclipse Adoptium\%%J"
    goto java_found
  )
)
:java_found
if not exist "%JAVA_HOME%\bin\java.exe" (
  echo [ERROR] Java 17 or newer is required. Install a JDK, then run this file again.
  pause
  exit /b 1
)

set "MAVEN_CMD="
for /f "delims=" %%M in ('where mvn.cmd 2^>nul') do (
  set "MAVEN_CMD=%%M"
  goto maven_found
)
for /f "delims=" %%M in ('dir /b /s "%ProgramFiles%\JetBrains\mvn.cmd" 2^>nul') do (
  set "MAVEN_CMD=%%M"
  goto maven_found
)
if not defined MAVEN_CMD (
  for /d %%D in ("%ProgramFiles%\JetBrains\*") do (
    if not defined MAVEN_CMD if exist "%%~fD\plugins\maven-plugin\lib\maven3\bin\mvn.cmd" (
      set "MAVEN_CMD=%%~fD\plugins\maven-plugin\lib\maven3\bin\mvn.cmd"
      goto maven_found
    )
  )
)
:maven_found
if not defined MAVEN_CMD (
  if exist "%PROJECT_ROOT%..\Software Lab Project\backend\mvnw.cmd" set "MAVEN_CMD=%PROJECT_ROOT%..\Software Lab Project\backend\mvnw.cmd"
)
if not defined MAVEN_CMD (
  rem Keep a private Maven copy outside the repository. This makes the project
  rem runnable on a new PC without asking the user to configure PATH.
  set "MAVEN_VERSION=3.9.9"
  set "CAREERFORGE_MAVEN_HOME=%LOCALAPPDATA%\CareerForge\tools\apache-maven-3.9.9"
  if exist "%CAREERFORGE_MAVEN_HOME%\bin\mvn.cmd" set "MAVEN_CMD=%CAREERFORGE_MAVEN_HOME%\bin\mvn.cmd"
)
if not defined MAVEN_CMD (
  echo Maven was not found. Downloading a private Maven copy for CareerForge...
  set "CAREERFORGE_TOOLS=%LOCALAPPDATA%\CareerForge\tools"
  set "CAREERFORGE_MAVEN_ZIP=%CAREERFORGE_TOOLS%\apache-maven-3.9.9-bin.zip"
  if not exist "%CAREERFORGE_TOOLS%" mkdir "%CAREERFORGE_TOOLS%"
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; Invoke-WebRequest -UseBasicParsing -Uri 'https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip' -OutFile '%CAREERFORGE_MAVEN_ZIP%'; Expand-Archive -LiteralPath '%CAREERFORGE_MAVEN_ZIP%' -DestinationPath '%CAREERFORGE_TOOLS%' -Force; Remove-Item -LiteralPath '%CAREERFORGE_MAVEN_ZIP%' -Force"
  if errorlevel 1 (
    echo [ERROR] Maven could not be downloaded. Check your Internet connection and run this file again.
    pause
    exit /b 1
  )
  if exist "%CAREERFORGE_MAVEN_HOME%\bin\mvn.cmd" set "MAVEN_CMD=%CAREERFORGE_MAVEN_HOME%\bin\mvn.cmd"
)
if not defined MAVEN_CMD (
  echo [ERROR] Maven setup did not finish correctly. Run this file again.
  pause
  exit /b 1
)

if exist "%PROJECT_ROOT%.env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%PROJECT_ROOT%.env") do if not "%%A"=="" set "%%A=%%B"
)

echo Starting CareerForge API at http://localhost:4000/api
call "%MAVEN_CMD%" -f "%PROJECT_ROOT%pom.xml" spring-boot:run
echo.
echo The CareerForge API stopped. Review the message above.
pause
