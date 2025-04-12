package lk.ijse.exampro.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.Transformation;
import com.cloudinary.utils.ObjectUtils;
import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.entity.User;
import lk.ijse.exampro.service.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryServiceImpl implements CloudinaryService {

    @Autowired
    private Cloudinary cloudinary;

    @Override
    public Map uploadImage(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("File cannot be empty");
        }
        if (!file.getContentType().startsWith("image/")) {
            throw new IOException("Only image files are allowed");
        }

        try {
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "transformation", new Transformation().width(200).height(200).crop("fill"),
                            "folder", "exampro/profile_pictures"
                    ));
            return uploadResult;
        } catch (Exception e) {
            throw new IOException("Failed to upload image to Cloudinary: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteImage(String publicId) throws IOException {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            throw new IOException("Failed to delete image from Cloudinary", e);
        }
    }
}
