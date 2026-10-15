package com.speed.delivery.service.impl;

import com.speed.delivery.service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * FileStorageService implementation (Mock).
 */
@Slf4j
@Service
public class FileStorageServiceImpl implements FileStorageService {

    @Override
    public String uploadFile(byte[] fileData, String fileName) {
        String mockUrl = "https://storage.speed.vn/" + UUID.randomUUID() + "/" + fileName;
        log.info("[MOCK STORAGE] File uploaded: {}", mockUrl);
        return mockUrl;
    }

    @Override
    public void deleteFile(String fileUrl) {
        log.info("[MOCK STORAGE] File deleted: {}", fileUrl);
    }
}
