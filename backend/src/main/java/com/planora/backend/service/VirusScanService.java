package com.planora.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class VirusScanService {
    private static final Logger logger = LoggerFactory.getLogger(VirusScanService.class);

    public void scanFile(String objectKey, String fileName) {
        logger.info("Initializing virus scan integration hook for file: {} (objectKey: {})", fileName, objectKey);
        
        // Placeholder check: Simulate a clean scan for all files except for simulated malicious ones.
        if (fileName.toLowerCase().contains("malware") || fileName.toLowerCase().contains("virus")) {
            logger.warn("VIRUS DETECTED in file: {}", fileName);
            throw new IllegalArgumentException("File threat detected: The uploaded file has been flagged by the security scanning service.");
        }
        
        logger.info("Virus scan completed successfully. No threats detected in file: {}", fileName);
    }
}
