package com.speed.delivery.service.impl;

import com.speed.delivery.dto.request.AddressRequest;
import com.speed.delivery.dto.request.UpdateProfileRequest;
import com.speed.delivery.dto.response.AddressResponse;
import com.speed.delivery.dto.response.UserResponse;
import com.speed.delivery.entity.*;
import com.speed.delivery.exception.*;
import com.speed.delivery.repository.*;
import com.speed.delivery.service.AuditLogService;
import com.speed.delivery.service.CustomerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CustomerService implementation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final AddressRepository addressRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return mapUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) {
            if (userRepository.existsByPhone(request.getPhone()) && !request.getPhone().equals(user.getPhone())) {
                throw new DuplicateResourceException("Số điện thoại đã được sử dụng");
            }
            user.setPhone(request.getPhone());
        }
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());

        user = userRepository.save(user);
        auditLogService.log(user.getId(), "UPDATE_PROFILE", "User", user.getId(), "Customer profile updated");
        return mapUserResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(Long customerId) {
        customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));
        return addressRepository.findByCustomerIdOrderByIsDefaultDesc(customerId).stream()
                .map(this::mapAddressResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressResponse addAddress(Long customerId, AddressRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer", "id", customerId));

        Address address = Address.builder()
                .customer(customer)
                .label(request.getLabel())
                .contactName(request.getContactName())
                .contactPhone(request.getContactPhone())
                .addressLine(request.getAddressLine())
                .ward(request.getWard())
                .district(request.getDistrict())
                .city(request.getCity())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isDefault(request.getIsDefault() != null && request.getIsDefault())
                .build();

        if (address.getIsDefault()) {
            resetDefaultAddresses(customerId);
        }

        address = addressRepository.save(address);
        auditLogService.log(customer.getUser().getId(), "ADD_ADDRESS", "Address", address.getId(), "Address added");
        return mapAddressResponse(address);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long customerId, Long addressId, AddressRequest request) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));

        if (!address.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("Địa chỉ không thuộc về khách hàng này");
        }

        address.setLabel(request.getLabel());
        address.setContactName(request.getContactName());
        address.setContactPhone(request.getContactPhone());
        address.setAddressLine(request.getAddressLine());
        address.setWard(request.getWard());
        address.setDistrict(request.getDistrict());
        address.setCity(request.getCity());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());

        if (request.getIsDefault() != null && request.getIsDefault()) {
            resetDefaultAddresses(customerId);
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);
        return mapAddressResponse(address);
    }

    @Override
    @Transactional
    public void deleteAddress(Long customerId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
        if (!address.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("Địa chỉ không thuộc về khách hàng này");
        }
        addressRepository.delete(address);
    }

    @Override
    @Transactional
    public void setDefaultAddress(Long customerId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new ResourceNotFoundException("Address", "id", addressId));
        if (!address.getCustomer().getId().equals(customerId)) {
            throw new BadRequestException("Địa chỉ không thuộc về khách hàng này");
        }
        resetDefaultAddresses(customerId);
        address.setIsDefault(true);
        addressRepository.save(address);
    }

    private void resetDefaultAddresses(Long customerId) {
        addressRepository.findByCustomerIdOrderByIsDefaultDesc(customerId).forEach(a -> {
            if (a.getIsDefault()) {
                a.setIsDefault(false);
                addressRepository.save(a);
            }
        });
    }

    private UserResponse mapUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .isActive(user.getIsActive())
                .isVerified(user.getIsVerified())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()))
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().toString() : null)
                .build();
    }

    private AddressResponse mapAddressResponse(Address address) {
        return AddressResponse.builder()
                .id(address.getId())
                .label(address.getLabel())
                .contactName(address.getContactName())
                .contactPhone(address.getContactPhone())
                .addressLine(address.getAddressLine())
                .ward(address.getWard())
                .district(address.getDistrict())
                .city(address.getCity())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .isDefault(address.getIsDefault())
                .build();
    }
}
