package com.groundops.ops.api;

import com.groundops.ops.api.dto.TaskResponse;
import com.groundops.ops.service.TaskService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {
  private final TaskService taskService;

  public TaskController(TaskService taskService) {
    this.taskService = taskService;
  }

  @GetMapping
  public List<TaskResponse> listTasks() {
    return taskService.listTasks().stream().map(TaskResponse::from).toList();
  }

  @GetMapping("/{taskId}")
  public TaskResponse getTask(@PathVariable("taskId") String taskId) {
    return TaskResponse.from(taskService.getTask(taskId));
  }
}
