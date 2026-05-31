package com.planora.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CustomFieldResponseDTO {
    private Long id;
    private String name;
    private String fieldType;
    private List<String> options;
    private Integer position;
}
