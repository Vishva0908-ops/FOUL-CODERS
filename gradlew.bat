@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%"=="" @echo off
@rem Setup for Windows
setlocal enabledelayedexpansion

set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if %ERRORLEVEL% equ 0 goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH. 1>&2
echo. 1>&2
echo Please install the JDK. 1>&2
echo If you already have it installed, please set the JAVA_HOME environment variable. 1>&2
goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo. 1>&2
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME% 1>&2
echo Please set JAVA_HOME to point to an installed JDK. 1>&2
goto fail

:execute
@rem Setup the command line
set WRAPPER_JAR=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar
set WRAPPER_URL=https\://services.gradle.org/distributions/gradle-8.4-bin.zip

@rem Download the wrapper jar if it doesn't exist
if not exist "%WRAPPER_JAR%" (
    echo Downloading Gradle Wrapper...
    powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%APP_HOME%\gradle-8.4-bin.zip'"
    powershell -Command "Expand-Archive -Path '%APP_HOME%\gradle-8.4-bin.zip' -DestinationPath '%GRADLE_USER_HOME%\wrapper\dists' -Force"
    if exist "%APP_HOME%\gradle-8.4-bin.zip" del "%APP_HOME%\gradle-8.4-bin.zip"
)

@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%WRAPPER_JAR%" org.gradle.wrapper.GradleWrapperMain %*

:fail
exit /b 1
