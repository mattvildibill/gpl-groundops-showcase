FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml pom.xml
COPY services/ops-service/pom.xml services/ops-service/pom.xml
COPY services/planner-service/pom.xml services/planner-service/pom.xml
COPY services/audit-service/pom.xml services/audit-service/pom.xml
COPY tests/integration-tests/pom.xml tests/integration-tests/pom.xml
RUN mvn -q -pl services/ops-service -am dependency:go-offline
COPY services/ops-service/src services/ops-service/src
RUN mvn -q -pl services/ops-service -am package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/services/ops-service/target/ops-service-0.1.0-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java","-jar","/app/app.jar"]
