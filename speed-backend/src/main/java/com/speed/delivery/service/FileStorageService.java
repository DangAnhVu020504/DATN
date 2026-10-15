package com.speed.delivery.service;

/** File Storage Service (Mock). */
public interface FileStorageService {
    String uploadFile(byte[] fileData, String fileName);
    void deleteFile(String fileUrl);
}
