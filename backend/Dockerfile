# ---------- Build Stage ----------
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src src

# Download dependencies
RUN mvn dependency:go-offline

# Build the application
RUN mvn clean package -DskipTests

# ---------- Runtime Stage ----------
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]