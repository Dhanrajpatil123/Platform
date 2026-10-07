package com.extratechsolution.service;

import com.extratechsolution.dto.AnnouncementRequest;
import com.extratechsolution.dto.AnnouncementResponse;
import com.extratechsolution.entity.Announcement;
import com.extratechsolution.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

// Single-row design: the platform only ever has one current announcement,
// edited in place rather than a history of many. Simpler than it sounds —
// this just means "update the one row if it exists, else create it."
@Service
@RequiredArgsConstructor
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    @Transactional(readOnly = true)
    public AnnouncementResponse getActivePublic() {
        return announcementRepository.findAll().stream()
                .findFirst()
                .filter(Announcement::isActive)
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public AnnouncementResponse getCurrentAdmin() {
        return announcementRepository.findAll().stream()
                .findFirst()
                .map(this::toResponse)
                .orElse(null);
    }

    @Transactional
    public AnnouncementResponse update(AnnouncementRequest request) {
        Announcement announcement = announcementRepository.findAll().stream()
                .findFirst()
                .orElseGet(Announcement::new);

        announcement.setMessage(request.getMessage());
        announcement.setActive(request.isActive());
        announcement.setUpdatedAt(LocalDateTime.now());

        Announcement saved = announcementRepository.save(announcement);
        return toResponse(saved);
    }

    private AnnouncementResponse toResponse(Announcement announcement) {
        return new AnnouncementResponse(
                announcement.getId(),
                announcement.getMessage(),
                announcement.isActive(),
                announcement.getUpdatedAt()
        );
    }
}