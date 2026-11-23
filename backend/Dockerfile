# Giai đoạn 1: Build file .jar
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

# Giai đoạn 2: Chạy ứng dụng gọn nhẹ
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
# Giới hạn heap RAM để chạy ổn định trong mức 512MB RAM của Render Free
ENTRYPOINT ["java", "-Xmx384m", "-Xms128m", "-jar", "app.jar"]