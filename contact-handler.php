<?php
// contact-handler.php
// Configuration
$to_email = "hello@vibezandviews.com"; // Change this to your email
$from_email = "noreply@vibezandviews.com"; // Change this to your domain email
$subject_prefix = "Vibez&Views Contact Form: ";

// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Set to 0 in production

// Set headers for JSON response
header('Content-Type: application/json');

// Check if form was submitted
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Initialize response array
$response = ['success' => false, 'message' => ''];

try {
    // Sanitize and validate inputs
    $name = isset($_POST['name']) ? sanitize_input($_POST['name']) : '';
    $email = isset($_POST['_replyto']) ? sanitize_input($_POST['_replyto']) : '';
    $phone = isset($_POST['phone']) ? sanitize_input($_POST['phone']) : '';
    $country_code = isset($_POST['countryCode']) ? sanitize_input($_POST['countryCode']) : '';
    $topic = isset($_POST['topic']) ? sanitize_input($_POST['topic']) : '';
    $message = isset($_POST['message']) ? sanitize_input($_POST['message']) : '';
    $subscribe = isset($_POST['subscribe']) ? 'Yes' : 'No';
    
    // Honeypot check (spam protection)
    if (!empty($_POST['_gotcha'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Spam detected']);
        exit;
    }
    
    // Validate required fields
    $errors = [];
    
    if (empty($name)) {
        $errors[] = 'Name is required';
    }
    
    if (empty($email)) {
        $errors[] = 'Email is required';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'Invalid email format';
    }
    
    if (empty($topic)) {
        $errors[] = 'Topic is required';
    }
    
    if (empty($message)) {
        $errors[] = 'Message is required';
    }
    
    // If there are validation errors, return them
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode([
            'success' => false, 
            'message' => 'Validation failed: ' . implode(', ', $errors)
        ]);
        exit;
    }
    
    // Format the phone number
    $full_phone = !empty($phone) ? $country_code . ' ' . $phone : 'Not provided';
    
    // Format topic display
    $topic_display = ucwords(str_replace('-', ' ', $topic));
    
    // Prepare email subject
    $email_subject = $subject_prefix . $topic_display;
    
    // Prepare email body
    $email_body = "
    ========================================
    NEW CONTACT FORM SUBMISSION
    ========================================
    
    Name: $name
    Email: $email
    Phone: $full_phone
    Topic: $topic_display
    Subscribe to Newsletter: $subscribe
    
    ----------------------------------------
    MESSAGE:
    ----------------------------------------
    $message
    
    ----------------------------------------
    Submitted: " . date('Y-m-d H:i:s') . "
    IP Address: " . get_client_ip() . "
    ========================================
    ";
    
    // Prepare email headers
    $headers = [
        "From: $from_email",
        "Reply-To: $email",
        "X-Mailer: PHP/" . phpversion(),
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8"
    ];
    
    // Handle file uploads if present
    $attachments = [];
    $upload_dir = 'uploads/'; // Make sure this directory exists and is writable
    
    if (!empty($_FILES['supportingDocs']['name'][0])) {
        // Create upload directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0755, true);
        }
        
        $files = $_FILES['supportingDocs'];
        $file_count = count($files['name']);
        
        for ($i = 0; $i < $file_count; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $file_name = $files['name'][$i];
                $file_tmp = $files['tmp_name'][$i];
                $file_size = $files['size'][$i];
                $file_type = $files['type'][$i];
                
                // Validate file size (5MB max)
                if ($file_size > 5 * 1024 * 1024) {
                    continue; // Skip files larger than 5MB
                }
                
                // Validate file type
                $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                if (!in_array($file_type, $allowed_types)) {
                    continue; // Skip invalid file types
                }
                
                // Generate unique filename
                $unique_name = time() . '_' . uniqid() . '_' . $file_name;
                $upload_path = $upload_dir . $unique_name;
                
                // Move uploaded file
                if (move_uploaded_file($file_tmp, $upload_path)) {
                    $attachments[] = [
                        'name' => $file_name,
                        'path' => $upload_path,
                        'size' => format_bytes($file_size)
                    ];
                }
            }
        }
        
        // Add attachment info to email body
        if (!empty($attachments)) {
            $email_body .= "\n\nATTACHMENTS:\n";
            foreach ($attachments as $attachment) {
                $email_body .= "- {$attachment['name']} ({$attachment['size']})\n";
                $email_body .= "  Location: {$attachment['path']}\n";
            }
        }
    }
    
    // Send email
    $mail_sent = mail($to_email, $email_subject, $email_body, implode("\r\n", $headers));
    
    if ($mail_sent) {
        // Success response
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Thank you! Your message has been sent successfully. We\'ll get back to you within 48 hours.'
        ]);
        
        // Optional: Save to database
        // save_to_database($name, $email, $phone, $topic, $message, $subscribe);
        
        // Optional: Send auto-reply to user
        send_auto_reply($email, $name);
        
    } else {
        throw new Exception('Failed to send email');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred. Please try again or email us directly at ' . $to_email
    ]);
    
    // Log error (optional)
    error_log("Contact form error: " . $e->getMessage());
}

// Helper Functions
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

function get_client_ip() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        return $_SERVER['REMOTE_ADDR'];
    }
}

function format_bytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= (1 << (10 * $pow));
    return round($bytes, $precision) . ' ' . $units[$pow];
}

function send_auto_reply($to_email, $name) {
    $subject = "Thank you for contacting Vibez&Views!";
    $message = "
Hi";
}