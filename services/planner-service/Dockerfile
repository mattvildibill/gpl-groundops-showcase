FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml pom.xml
COPY services/planner-service/pom.xml services/planner-service/pom.xml
COPY services/ops-service/pom.xml services/ops-service/pom.xml
COPY services/audit-service/pom.xml services/audit-service/pom.xml
COPY tests/integration-tests/pom.xml tests/integration-tests/pom.xml
RUN mvn -q -pl services/planner-service -am dependency:go-offline
COPY services/planner-service/src services/planner-service/src
RUN mvn -q -pl services/planner-service -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/services/planner-service/target/planner-service-0.1.0-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
