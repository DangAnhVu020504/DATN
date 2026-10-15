package com.speed.delivery.service;

public interface CustomerService {
    com.speed.delivery.dto.response.UserResponse getProfile(String email);
    com.speed.delivery.dto.response.UserResponse updateProfile(String email, com.speed.delivery.dto.request.UpdateProfileRequest request);
    java.util.List<com.speed.delivery.dto.response.AddressResponse> getAddresses(Long customerId);
    com.speed.delivery.dto.response.AddressResponse addAddress(Long customerId, com.speed.delivery.dto.request.AddressRequest request);
    com.speed.delivery.dto.response.AddressResponse updateAddress(Long customerId, Long addressId, com.speed.delivery.dto.request.AddressRequest request);
    void deleteAddress(Long customerId, Long addressId);
    void setDefaultAddress(Long customerId, Long addressId);
}
