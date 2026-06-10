@echo off
setlocal

set "BASEDIR=%~dp0"
set "MAVEN_PROJECTBASEDIR=%BASEDIR:~0,-1%"
set "WRAPPER_JAR=%BASEDIR%.mvn\wrapper\maven-wrapper.jar"
set "WRAPPER_MAIN=org.apache.maven.wrapper.MavenWrapperMain"

if not exist "%WRAPPER_JAR%" (
  echo Maven wrapper jar not found: %WRAPPER_JAR%
  echo Download it from https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.3.2/maven-wrapper-3.3.2.jar
  exit /b 1
)

java "-Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR%" -classpath "%WRAPPER_JAR%" %WRAPPER_MAIN% %*
