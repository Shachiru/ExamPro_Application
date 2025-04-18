package lk.ijse.exampro.controller;

import lk.ijse.exampro.entity.Payment;
import lk.ijse.exampro.entity.User;
import lk.ijse.exampro.repository.PaymentRepository;
import lk.ijse.exampro.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/payment")
public class PaymentController {

    @Value("${payhere.merchant.id}")
    private String merchantId;
    @Value("${payhere.merchant.secret}")
    private String merchantSecret;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/initiate")
    public ResponseEntity<Map<String, String>> initiatePayment(@RequestParam UUID userId,
                                                               @RequestParam Long examId,
                                                               @RequestParam double amount) {
        Map<String, String> paymentData = new HashMap<>();
        paymentData.put("merchant_id", merchantId);
        paymentData.put("return_url", "http://localhost:8080/payment/success");
        paymentData.put("cancel_url", "http://localhost:8080/payment/cancel");
        paymentData.put("notify_url", "http://localhost:8080/api/v1/payment/notify");
        paymentData.put("order_id", "EXAMPRO_" + System.currentTimeMillis());
        paymentData.put("items", "Exam Fee");
        paymentData.put("currency", "LKR");
        paymentData.put("amount", String.format("%.2f", amount));
        paymentData.put("first_name", "User");
        paymentData.put("last_name", "Name");
        paymentData.put("email", "user@example.com");
        paymentData.put("phone", "0771234567");
        paymentData.put("address", "123, Main Street");
        paymentData.put("city", "Colombo");
        paymentData.put("country", "Sri Lanka");

        String hash = generateHash(paymentData.get("order_id"), paymentData.get("amount"), paymentData.get("currency"));
        paymentData.put("hash", hash);

        // Save initial payment record
        User user = userRepository.findById(userId).orElseThrow();
        Payment payment = new Payment();
        payment.setOrderId(paymentData.get("order_id"));
        payment.setUser(user);
        payment.setExamId(examId);
        payment.setAmount(amount);
        payment.setCurrency("LKR");
        payment.setStatus("PENDING");
        payment.setCreatedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        return ResponseEntity.ok(paymentData);
    }

    @PostMapping("/notify")
    public void handleNotification(HttpServletRequest request) {
        String merchantId = request.getParameter("merchant_id");
        String orderId = request.getParameter("order_id");
        String payhereAmount = request.getParameter("payhere_amount");
        String payhereCurrency = request.getParameter("payhere_currency");
        String statusCode = request.getParameter("status_code");
        String md5sig = request.getParameter("md5sig");

        String localMd5sig = generateLocalMd5sig(merchantId, orderId, payhereAmount, payhereCurrency, statusCode);
        if (md5sig.equals(localMd5sig) && "2".equals(statusCode)) {
            Optional<Payment> paymentOpt = paymentRepository.findByOrderId(orderId);
            if (paymentOpt.isPresent()) {
                Payment payment = paymentOpt.get();
                payment.setStatus("SUCCESS");
                paymentRepository.save(payment);
            } else {
                // Fallback: Create new payment (adjust userId dynamically)
                User user = userRepository.findById(UUID.fromString("your-user-id")).orElseThrow();
                Payment newPayment = new Payment();
                newPayment.setOrderId(orderId);
                newPayment.setUser(user);
                newPayment.setExamId(101L); // Replace with dynamic examId
                newPayment.setAmount(Double.parseDouble(payhereAmount));
                newPayment.setCurrency(payhereCurrency);
                newPayment.setStatus("SUCCESS");
                newPayment.setCreatedAt(LocalDateTime.now());
                paymentRepository.save(newPayment);
            }
        }
    }

    private String generateHash(String orderId, String amount, String currency) {
        String raw = merchantId + orderId + amount + currency +
                toHexString(merchantSecret.getBytes());
        return toHexString(getMD5(raw.getBytes()));
    }

    private String generateLocalMd5sig(String merchantId, String orderId, String amount, String currency, String statusCode) {
        String raw = merchantId + orderId + amount + currency + statusCode +
                toHexString(merchantSecret.getBytes());
        return toHexString(getMD5(raw.getBytes()));
    }

    private byte[] getMD5(byte[] input) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            return md.digest(input);
        } catch (Exception e) {
            throw new RuntimeException("MD5 hash error", e);
        }
    }

    private String toHexString(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xFF & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString().toUpperCase();
    }
}