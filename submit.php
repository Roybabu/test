<?php
/* ============================================================================
   SUBMISSION ENDPOINT
   ============================================================================ */

declare(strict_types=1);

// ---- CONFIG ---------------------------------------------------------------
const ADMIN_KEY   = '8723004003';
const STORE_DIR   = __DIR__ . '/data';
const STORE_FILE  = STORE_DIR . '/pending-submissions.json';
const VERIFICATION_FILE = STORE_DIR . '/workshop-verification.json';
const PUBLISHED_FILE = STORE_DIR . '/published-workshops.json';
const AUDIT_FILE = STORE_DIR . '/admin-audit-log.json';
const MAX_PENDING = 5000;
const MAX_PER_IP  = 25;
// ---------------------------------------------------------------------------

const EMIRATES = [
    'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman',
    'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
];

const WORKSHOP_TYPES = ['agency', 'nonagency'];
const SUBMISSION_KINDS = ['new', 'edit'];

const MAX_LENGTHS = [
    'name'    => 200,
    'target'  => 200,
    'address' => 300,
    'phone'   => 120,
    'hours'   => 200,
    'notes'   => 2000,
    'email'   => 254,
    'list'    => 60,
    'insurer' => 150,
];

const ALLOWED_MAKES = [
    'Audi', 'Bentley', 'Bestune', 'BMW', 'BMW Alpina', 'Bugatti', 'BYD',
    'Cadillac', 'Changan', 'Chevrolet', 'Chrysler', 'Dodge', 'Ferrari',
    'Ford', 'FUSO', 'GAC', 'Geely', 'Genesis', 'GMC', 'GWM', 'Honda',
    'Hyundai', 'Infiniti', 'Isuzu', 'JAC', 'Jaecoo', 'Jaguar', 'Jeep',
    'Kia', 'Land Rover', 'Lexus', 'Lincoln', 'Lynk & Co', 'Mahindra',
    'Maserati', 'Maybach', 'Mazda', 'Mercedes-Benz', 'MG', 'MINI',
    'Mitsubishi', 'Nissan', 'Omoda', 'Opel', 'Peugeot', 'Porsche', 'RAM',
    'Renault', 'Rolls-Royce', 'Subaru', 'Suzuki', 'Tesla', 'Toyota',
    'Volkswagen', 'Volvo'
];

/*
 * Keep this list in sync with data/data-insurers.js.
 * The server validates against this allow-list; the browser's insurer picker
 * is convenience only and is never treated as a security boundary.
 */
const ALLOWED_INSURERS = [
    "ADNIC (Abu Dhabi National Insurance Company)",
    "Abu Dhabi National Takaful Company",
    "Adamjee Insurance",
    "Al Ain Ahlia Insurance Company",
    "Al Buhaira National Insurance Company (ABNIC)",
    "Al Dhafra National Insurance Company",
    "Al Fujairah National Insurance Company (AFNIC)",
    "Al Ittihad Al Watani Insurance Company",
    "Al Khazna Insurance Company",
    "Al Sagr National Insurance Company",
    "Al Wathba National Insurance Company (AWNIC)",
    "Alliance Insurance Company",
    "Arabia Insurance Company",
    "Dar Al Takaful",
    "Damana",
    "Dubai Insurance Company (DIC)",
    "Dubai Islamic Insurance & Reinsurance Co. (AMAN)",
    "Dubai National Insurance & Reinsurance Company (DNIRC)",
    "Emirates Insurance Company (EIC)",
    "GIG Gulf (formerly AXA Gulf)",
    "Insurance House",
    "Iran Insurance Company",
    "LIVA Insurance",
    "National General Insurance Company (NGI)",
    "National Life & General Insurance Company",
    "New India Assurance (UAE branch)",
    "Noor Takaful",
    "Orient Insurance PJSC",
    "Orient Takaful",
    "Oriental Insurance Company (UAE branch)",
    "Qatar Insurance Company (QIC)",
    "RAK Insurance (RAK National Insurance Company)",
    "Salama (Islamic Arab Insurance Company)",
    "Sharjah Insurance Company",
    "Sukoon Insurance (formerly Oman Insurance Company)",
    "Sukoon Takaful (formerly Arabian Scandinavian Insurance Co. / ASCANA)",
    "Takaful Emarat",
    "Tokio Marine",
    "Union Insurance Company",
    "United Fidelity Insurance Company",
    "United Insurance Company",
    "Watania Takaful (National Takaful Company)",
    "Yas Takaful (formerly Hilal Takaful)"
];

// ---- HTTP/session security ------------------------------------------------
// The admin secret is server-side only. Prefer GF_ADMIN_SECRET in production.
function configuredAdminSecret(): string {
    $env = getenv('GF_ADMIN_SECRET');
    if (is_string($env) && $env !== '') return $env;
    return ADMIN_KEY;
}


function startAdminSession(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('gf_admin_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function out(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requirePost(): void {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        out(['ok' => false, 'error' => 'This operation requires POST.'], 405);
    }
}

function requireAdminSession(): void {
    startAdminSession();
    if (empty($_SESSION['gf_admin_authenticated'])) {
        out(['ok' => false, 'error' => 'Authentication required.'], 401);
    }
}

function requireCsrf(): void {
    requireAdminSession();
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['gf_admin_csrf'] ?? '';
    if (!is_string($token) || !is_string($expected) || $token === '' || $expected === '' || !hash_equals($expected, $token)) {
        out(['ok' => false, 'error' => 'Invalid or missing CSRF token.'], 403);
    }
}

function loginAdmin(string $secret): void {
    startAdminSession();
    $configured = configuredAdminSecret();
    if ($configured === 'CHANGE-ME-BEFORE-UPLOADING' || $configured === '') {
        out(['ok' => false, 'error' => 'Configure the server-side admin secret before using the admin page.'], 403);
    }
    if (!hash_equals($configured, $secret)) {
        out(['ok' => false, 'error' => 'Invalid admin credentials.'], 403);
    }
    session_regenerate_id(true);
    $_SESSION['gf_admin_authenticated'] = true;
    $_SESSION['gf_admin_csrf'] = bin2hex(random_bytes(32));
    $_SESSION['gf_admin_login_at'] = time();
    out(['ok' => true, 'csrfToken' => $_SESSION['gf_admin_csrf']]);
}

function logoutAdmin(): void {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'] ?? '/',
            'domain' => $params['domain'] ?? '',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }
    session_destroy();
    out(['ok' => true]);
}

function validationError(string $message, string $field = ''): void {
    $response = ['ok' => false, 'error' => $message];
    if ($field !== '') $response['field'] = $field;
    out($response, 422);
}

function ensureStore(): void {
    if (!is_dir(STORE_DIR)) @mkdir(STORE_DIR, 0755, true);
    foreach ([STORE_FILE, VERIFICATION_FILE, PUBLISHED_FILE, AUDIT_FILE] as $file) {
        if (!file_exists($file)) @file_put_contents($file, "[]");
    }
}

function readJsonFile(string $file): array {
    if (!file_exists($file)) return [];
    $raw = @file_get_contents($file);
    if ($raw === false || trim($raw) === '') return [];
    $rows = json_decode($raw, true);
    return is_array($rows) ? $rows : [];
}

function writeJsonFileUnlocked(string $file, array $rows): bool {
    if (!is_dir(STORE_DIR)) @mkdir(STORE_DIR, 0755, true);
    $json = json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) return false;
    $tmp = $file . '.tmp-' . bin2hex(random_bytes(6));
    $fp = @fopen($tmp, 'wb');
    if (!$fp) return false;
    $ok = fwrite($fp, $json) !== false;
    if ($ok && function_exists('fsync')) $ok = fsync($fp);
    fflush($fp);
    fclose($fp);
    if (!$ok) { @unlink($tmp); return false; }
    if (!@rename($tmp, $file)) { @unlink($tmp); return false; }
    $verify = @file_get_contents($file);
    if ($verify === false || json_decode($verify, true) !== $rows) return false;
    return true;
}

function stateLockHandle() {
    ensureStore();
    $lock = @fopen(STORE_DIR . '/.state.lock', 'c');
    if (!$lock || !flock($lock, LOCK_EX)) {
        if ($lock) fclose($lock);
        out(['ok' => false, 'error' => 'Could not acquire the data store lock.'], 503);
    }
    return $lock;
}

function writeTransactionJournal(array $journal): bool {
    $file = STORE_DIR . '/state-transaction.json';
    return writeJsonFileUnlocked($file, $journal);
}

function restorePublicationStateUnlocked(array $pending, array $published): bool {
    $okPending = writeJsonFileUnlocked(STORE_FILE, $pending);
    $okPublished = writeJsonFileUnlocked(PUBLISHED_FILE, $published);
    if (!$okPending || !$okPublished) return false;
    return readJsonFile(STORE_FILE) === $pending && readJsonFile(PUBLISHED_FILE) === $published;
}

function recoverPublicationTransactionUnlocked(): void {
    $file = STORE_DIR . '/state-transaction.json';
    if (!file_exists($file)) return;
    $journal = readJsonFile($file);
    if (!$journal || ($journal['type'] ?? '') !== 'publication') return;
    $phase = (string)($journal['phase'] ?? 'prepared');
    $pending = is_array($journal['pending'] ?? null) ? $journal['pending'] : null;
    $published = is_array($journal['published'] ?? null) ? $journal['published'] : null;
    $pendingAfter = is_array($journal['pendingAfter'] ?? null) ? $journal['pendingAfter'] : null;
    $publishedAfter = is_array($journal['publishedAfter'] ?? null) ? $journal['publishedAfter'] : null;
    if ($pending === null || $published === null || $pendingAfter === null || $publishedAfter === null) return;
    $ok = $phase === 'committed'
        ? restorePublicationStateUnlocked($pendingAfter, $publishedAfter)
        : restorePublicationStateUnlocked($pending, $published);
    if ($ok) @unlink($file);
}

function withStateLock(callable $callback): mixed {
    $lock = stateLockHandle();
    try {
        recoverPublicationTransactionUnlocked();
        return $callback();
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function readAll(): array { ensureStore(); return readJsonFile(STORE_FILE); }
function readVerification(): array { ensureStore(); return readJsonFile(VERIFICATION_FILE); }
function readPublished(): array { ensureStore(); return readJsonFile(PUBLISHED_FILE); }
function readAudit(): array { ensureStore(); return readJsonFile(AUDIT_FILE); }

function writeAll(array $rows): bool { return writeJsonFileUnlocked(STORE_FILE, $rows); }
function writeVerification(array $rows): bool { return writeJsonFileUnlocked(VERIFICATION_FILE, $rows); }
function writePublished(array $rows): bool { return writeJsonFileUnlocked(PUBLISHED_FILE, $rows); }
function writeAudit(array $rows): bool { return writeJsonFileUnlocked(AUDIT_FILE, array_slice($rows, -10000)); }

function auditMetadata(mixed $value): mixed {
    $blocked=['password','passwd','pass','admin_key','adminkey','authorization','cookie','token','secret','credential','credentials','api_key','apikey'];
    if(is_array($value)){ $out=[]; foreach($value as $k=>$v){$lk=strtolower((string)$k); foreach($blocked as $b){if($lk===$b||str_contains($lk,$b))continue 2;} $out[$k]=auditMetadata($v);} return $out; }
    if(is_object($value)) return auditMetadata((array)$value);
    if(is_string($value) && strlen($value)>500) return substr($value,0,500).'…';
    return $value;
}
function recordAuditUnlocked(string $submissionId,string $actionType,string $previousStatus,string $newStatus,array $metadata=[]): bool {
    $rows=readAudit();
    $rows[]=['administrator'=>'admin','submissionId'=>$submissionId,'actionType'=>$actionType,'timestamp'=>date('c'),'previousStatus'=>$previousStatus,'newStatus'=>$newStatus,'metadata'=>auditMetadata($metadata)];
    return writeAudit($rows);
}
function recordAudit(string $submissionId,string $actionType,string $previousStatus,string $newStatus,array $metadata=[]): bool {
    return withStateLock(fn() => recordAuditUnlocked($submissionId,$actionType,$previousStatus,$newStatus,$metadata));
}

function publishAtomically(array $pendingBefore, array $pendingAfter, array $publishedBefore, array $publishedAfter): bool {
    $journalFile = STORE_DIR . '/state-transaction.json';
    $journal = [
        'type' => 'publication',
        'phase' => 'prepared',
        'createdAt' => date('c'),
        'pending' => $pendingBefore,
        'published' => $publishedBefore,
        'pendingAfter' => $pendingAfter,
        'publishedAfter' => $publishedAfter,
    ];
    if (!writeTransactionJournal($journal)) return false;

    if (!writeJsonFileUnlocked(PUBLISHED_FILE, $publishedAfter)) {
        if (restorePublicationStateUnlocked($pendingBefore, $publishedBefore)) @unlink($journalFile);
        return false;
    }
    $journal['phase'] = 'published';
    if (!writeTransactionJournal($journal)) {
        if (restorePublicationStateUnlocked($pendingBefore, $publishedBefore)) @unlink($journalFile);
        return false;
    }

    if (getenv('GF_TEST_FAIL_AFTER_PUBLISHED_WRITE') === '1') {
        if (restorePublicationStateUnlocked($pendingBefore, $publishedBefore)) @unlink($journalFile);
        return false;
    }

    if (!writeJsonFileUnlocked(STORE_FILE, $pendingAfter)) {
        if (restorePublicationStateUnlocked($pendingBefore, $publishedBefore)) @unlink($journalFile);
        return false;
    }
    $journal['phase'] = 'committed';
    if (!writeTransactionJournal($journal)) {
        if (restorePublicationStateUnlocked($pendingBefore, $publishedBefore)) @unlink($journalFile);
        return false;
    }

    if (readJsonFile(PUBLISHED_FILE) !== $publishedAfter || readJsonFile(STORE_FILE) !== $pendingAfter) {
        if (restorePublicationStateUnlocked($pendingBefore, $publishedBefore)) @unlink($journalFile);
        return false;
    }
    @unlink($journalFile);
    return true;
}


/**
 * Validate and normalize a scalar string. Never silently truncates input.
 * Control characters are rejected rather than stripped.
 */
function validateString(mixed $value, string $field, int $max, bool $required, string $pattern): string {
    if ($value === null) {
        if ($required) validationError("$field is required.", $field);
        return '';
    }
    if (!is_string($value)) {
        validationError("$field must be a string.", $field);
    }

    $value = trim($value);
    if ($value === '') {
        if ($required) validationError("$field is required.", $field);
        return '';
    }

    if (function_exists('mb_strlen')) {
        $length = mb_strlen($value, 'UTF-8');
    } else {
        $length = strlen($value);
    }
    if ($length > $max) {
        validationError("$field exceeds the maximum length of $max characters.", $field);
    }

    if (preg_match('/[\x00-\x1F\x7F]/', $value)) {
        validationError("$field contains control characters.", $field);
    }

    if (!preg_match($pattern, $value)) {
        validationError("$field contains invalid characters.", $field);
    }

    return $value;
}

function validateList(
    mixed $value,
    string $field,
    int $itemMax,
    int $maxItems,
    bool $required,
    array $allowed = []
): array {
    if ($value === null) {
        if ($required) validationError("$field is required.", $field);
        return [];
    }
    if (!is_array($value)) {
        validationError("$field must be an array.", $field);
    }
    if (count($value) > $maxItems) {
        validationError("$field contains too many items.", $field);
    }

    $result = [];
    foreach ($value as $i => $item) {
        if (!is_string($item)) {
            validationError("$field item " . ($i + 1) . " must be a string.", $field);
        }

        $item = validateString(
            $item,
            "$field item " . ($i + 1),
            $itemMax,
            true,
            '/^[\p{L}\p{N}\p{M}][\p{L}\p{N}\p{M}\s&().,\-\/+\'’]*$/u'
        );

        if ($allowed && !in_array($item, $allowed, true)) {
            validationError("$field contains an unsupported value: $item.", $field);
        }
        $result[] = $item;
    }

    $result = array_values(array_unique($result));
    if ($required && count($result) === 0) {
        validationError("$field is required.", $field);
    }
    return $result;
}

/**
 * Accept common UAE phone formats and normalize every number to E.164-ish
 * UAE form (+971XXXXXXXXX). Multiple numbers may be separated by comma,
 * semicolon, slash, or "or".
 */
function normalizePhone(mixed $value, bool $required = false): string {
    if ($value === null || $value === '') {
        if ($required) validationError('Phone is required.', 'phone');
        return '';
    }
    if (!is_string($value)) validationError('Phone must be a string.', 'phone');

    $value = trim($value);
    if (strlen($value) > MAX_LENGTHS['phone']) {
        validationError('Phone exceeds the maximum length.', 'phone');
    }
    if (preg_match('/[\x00-\x1F\x7F]/', $value)) {
        validationError('Phone contains control characters.', 'phone');
    }
    if (!preg_match('/^[0-9+()\s.,;\/\-]+(?:\s+or\s+[0-9+()\s.,;\/\-]+)?$/i', $value)) {
        validationError('Phone contains invalid characters.', 'phone');
    }

    $parts = preg_split('/\s*(?:,|;|\/|\bor\b)\s*/i', $value, -1, PREG_SPLIT_NO_EMPTY);
    if (!$parts) validationError('Phone is invalid.', 'phone');

    $normalized = [];
    foreach ($parts as $part) {
        $digits = preg_replace('/\D+/', '', $part);
        if ($digits === null || $digits === '') {
            validationError('Phone contains an invalid number.', 'phone');
        }

        // UAE local landline: 04xxxxxxx; local mobile: 05xxxxxxxx.
        if (str_starts_with($digits, '00')) {
            $digits = substr($digits, 2);
        }
        if (str_starts_with($digits, '971')) {
            $local = substr($digits, 3);
        } elseif (str_starts_with($digits, '0')) {
            $local = $digits;
        } else {
            validationError('Phone must be a UAE number.', 'phone');
        }

        if (!preg_match('/^0(?:2|3|4|6|7|9)\d{7}$/', $local)
            && !preg_match('/^05\d{8}$/', $local)) {
            validationError('Phone must be a valid UAE landline or mobile number.', 'phone');
        }

        $normalized[] = '+971' . substr($local, 1);
    }

    return implode(', ', array_values(array_unique($normalized)));
}

function validateEmail(mixed $value, bool $required = false): string {
    if ($value === null || $value === '') {
        if ($required) validationError('Email is required.', 'email');
        return '';
    }
    if (!is_string($value)) validationError('Email must be a string.', 'email');
    $value = trim($value);

    if (strlen($value) > MAX_LENGTHS['email']) {
        validationError('Email exceeds the maximum length.', 'email');
    }
    if (preg_match('/[\x00-\x1F\x7F]/', $value) || filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
        validationError('Email address is invalid.', 'email');
    }
    return $value;
}

function normalizeIdentityText(mixed $value): string {
    $value = is_string($value) ? $value : '';
    if (function_exists('normalizer_normalize')) {
        $value = normalizer_normalize($value, Normalizer::FORM_KC) ?: $value;
    }
    $value = mb_strtolower($value, 'UTF-8');
    $value = preg_replace('/\s+/u', ' ', trim($value)) ?? trim($value);
    $value = preg_replace('/[^\p{L}\p{N}\s]/u', '', $value) ?? $value;
    return preg_replace('/\s+/u', ' ', trim($value)) ?? trim($value);
}

function normalizeIdentityPhone(mixed $value): string {
    $value = is_string($value) ? $value : '';
    $value = preg_replace('/\D+/', '', $value) ?? '';
    $value = preg_replace('/^00/', '', $value) ?? $value;
    if (str_starts_with($value, '971')) return '971' . (substr($value, 3, 1) === '0' ? substr($value, 4) : substr($value, 3));
    if (str_starts_with($value, '0')) return '971' . substr($value, 1);
    return $value;
}

function identityKey(array $w): string {
    return implode('|', [
        normalizeIdentityText($w['name'] ?? ''),
        normalizeIdentityText($w['emirate'] ?? ''),
        normalizeIdentityPhone($w['phone'] ?? ''),
        normalizeIdentityText($w['address'] ?? '')
    ]);
}

function stableWorkshopId(array $w): string {
    $input = identityKey($w);
    $hash = 2166136261;
    $bytes = unpack('C*', $input) ?: [];
    foreach ($bytes as $byte) {
        $hash ^= $byte;
        $hash = ($hash * 16777619) & 0xFFFFFFFF;
    }
    return 'ws_' . str_pad(strtolower(dechex($hash)), 8, '0', STR_PAD_LEFT);
}

function exactWorkshopMatch(array $a, array $b): bool {
    if (!empty($a['id']) && !empty($b['id'])) return hash_equals((string)$a['id'], (string)$b['id']);
    return identityKey($a) === identityKey($b);
}

function uncertainWorkshopMatch(array $a, array $b): bool {
    if (normalizeIdentityText($a['name'] ?? '') !== normalizeIdentityText($b['name'] ?? '')) return false;
    if (normalizeIdentityText($a['emirate'] ?? '') !== normalizeIdentityText($b['emirate'] ?? '')) return false;
    return !exactWorkshopMatch($a, $b);
}

function ipHash(): string {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    return substr(hash('sha256', $ip . '|' . configuredAdminSecret()), 0, 16);
}

if (getenv('GF_TEST_LIBRARY_ONLY') === '1') {
    return;
}

// ---- request parsing ------------------------------------------------------
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$decoded = [];
if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        validationError('A JSON request body is required.');
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || json_last_error() !== JSON_ERROR_NONE) {
        validationError('Malformed JSON request body.');
    }
} elseif ($method === 'GET') {
    $decoded = [];
} else {
    out(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$allowedTopLevelFields = ['action', 'key', 'workshop', 'id', 'ids', 'status'];
$unknownTopLevel = array_diff(array_keys($decoded), $allowedTopLevelFields);
if ($unknownTopLevel) {
    validationError('Unknown request field: ' . (string)reset($unknownTopLevel) . '.');
}

$action = $decoded['action'] ?? $_GET['action'] ?? '';
$key = $decoded['key'] ?? '';

if (!is_string($action) || $action === '') {
    validationError('Action is required.', 'action');
}
$allowedActions = ['login', 'session', 'logout', 'submit', 'published', 'list', 'delete-published', 'submission-status', 'approve', 'reject', 'publish', 'edit', 'edit-own', 'audit-list', 'verification-list', 'verification'];
if (!in_array($action, $allowedActions, true)) {
    validationError('Unknown action.', 'action');
}
if ($action !== 'login' && array_key_exists('key', $decoded)) {
    validationError('Admin credentials must only be supplied to the login endpoint.', 'key');
}

if ($action === 'login') {
    requirePost();
    if (!is_string($key) || $key === '') validationError('Admin secret is required.', 'key');
    loginAdmin($key);
}

if ($action === 'session') {
    if ($method !== 'GET') requirePost();
    startAdminSession();
    if (empty($_SESSION['gf_admin_authenticated'])) out(['ok' => false, 'authenticated' => false], 401);
    out(['ok' => true, 'authenticated' => true, 'csrfToken' => (string)($_SESSION['gf_admin_csrf'] ?? '')]);
}

if ($action === 'logout') {
    requirePost();
    requireCsrf();
    logoutAdmin();
}

// ---- PUBLIC: submit a workshop -------------------------------------------
if ($action === 'submit') {
    requirePost();
    if (!array_key_exists('workshop', $decoded) || !is_array($decoded['workshop'])) {
        validationError('Workshop data is required.', 'workshop');
    }

    $w = $decoded['workshop'];

    $allowedWorkshopFields = [
        'id', 'name', 'type', 'emirate', 'phone', 'makes', 'insurers',
        'address', 'hours', 'notes', 'email', 'kind', 'target', 'duplicateReview'
    ];
    $unknown = array_diff(array_keys($w), $allowedWorkshopFields);
    if ($unknown) {
        validationError('Unknown workshop field: ' . (string)reset($unknown) . '.');
    }

    // Required fields.
    $name = validateString(
        $w['name'] ?? null, 'Workshop name', MAX_LENGTHS['name'], true,
        '/^[\p{L}\p{N}][\p{L}\p{N}\p{M}\s&().,\-\/+\'’]*$/u'
    );

    $type = validateString(
        $w['type'] ?? null, 'Workshop type', 20, true,
        '/^[a-z]+$/'
    );
    if (!in_array($type, WORKSHOP_TYPES, true)) {
        validationError('Workshop type must be agency or nonagency.', 'type');
    }

    $emirate = validateString(
        $w['emirate'] ?? null, 'Emirate', 30, true,
        '/^[\p{L}\s-]+$/u'
    );
    if (!in_array($emirate, EMIRATES, true)) {
        validationError('Invalid UAE emirate.', 'emirate');
    }

    $workshopId = validateString(
        $w['id'] ?? null, 'Workshop id', 20, false,
        '/^ws_[a-f0-9]{8}$/'
    );
    $duplicateReview = $w['duplicateReview'] ?? false;
    if (!is_bool($duplicateReview)) {
        validationError('duplicateReview must be a boolean.', 'duplicateReview');
    }

    // Optional fields.
    $address = validateString(
        $w['address'] ?? null, 'Address', MAX_LENGTHS['address'], false,
        '/^[\p{L}\p{N}\p{M}\s#&().,\-\/+:;\'’]*$/u'
    );
    $hours = validateString(
        $w['hours'] ?? null, 'Hours', MAX_LENGTHS['hours'], false,
        '/^[\p{L}\p{N}\p{M}\s#&().,\-\/+:;\'’]*$/u'
    );
    $notes = validateString(
        $w['notes'] ?? null, 'Notes', MAX_LENGTHS['notes'], false,
        '/^[\p{L}\p{N}\p{M}\s#&().,\-\/+:;!?%\'’]*$/u'
    );
    $phone = normalizePhone($w['phone'] ?? null, false);
    $email = validateEmail($w['email'] ?? null, false);

    $kind = validateString(
        $w['kind'] ?? 'new', 'Submission kind', 10, true,
        '/^[a-z]+$/'
    );
    if (!in_array($kind, SUBMISSION_KINDS, true)) {
        validationError('Submission kind must be new or edit.', 'kind');
    }

    $target = validateString(
        $w['target'] ?? '', 'Target', MAX_LENGTHS['target'], false,
        '/^[A-Za-z0-9][A-Za-z0-9._:-]*$/'
    );
    if ($kind === 'edit' && $target === '') {
        validationError('Target is required for an edit submission.', 'target');
    }

    // Car makes are required only for agency submissions.
    $makes = validateList(
        $w['makes'] ?? null,
        'Makes',
        MAX_LENGTHS['list'],
        25,
        $type === 'agency',
        ALLOWED_MAKES
    );

    // Insurer panels are required only for non-agency submissions.
    $insurers = validateList(
        $w['insurers'] ?? null,
        'Insurers',
        MAX_LENGTHS['insurer'],
        25,
        $type === 'nonagency',
        ALLOWED_INSURERS
    );

    // Assemble the validated fields into the record that actually gets stored.
    $workshop = [
        'id'       => $workshopId,
        'name'     => $name,
        'type'     => $type,
        'emirate'  => $emirate,
        'address'  => $address,
        'phone'    => $phone,
        'hours'    => $hours,
        'notes'    => $notes,
        'makes'    => $makes,
        'insurers' => $insurers,
        'duplicateReview' => $duplicateReview,
    ];
    if ($email !== '') $workshop['email'] = $email;

    $result = withStateLock(function() use ($kind, $target, $workshop) {
        $rows = readAll();

        // Light abuse guard, calculated while the same exclusive state lock is held.
        $mine = 0;
        $me = ipHash();
        $cut = time() - 3600;
        foreach ($rows as $r) {
            if (($r['by'] ?? '') === $me && (int)($r['ts'] ?? 0) > $cut) $mine++;
        }
        if ($mine >= MAX_PER_IP) {
            return ['ok' => false, 'status' => 429, 'error' => 'Too many submissions from this connection. Try again later.'];
        }
        if (count($rows) >= MAX_PENDING) {
            return ['ok' => false, 'status' => 507, 'error' => 'The submissions file is full. Contact the site owner.'];
        }

        $workshop['duplicateReview'] = false;
        foreach ($rows as $existing) {
            $existingWorkshop = is_array($existing['workshop'] ?? null) ? $existing['workshop'] : [];
            // A row with no usable name is malformed (e.g. written by an older
            // build that failed to store the workshop body). Its identity key
            // would be empty and would therefore collide with every other
            // malformed row, blocking all future submissions. Skip those.
            if (trim((string)($existingWorkshop['name'] ?? '')) === '') continue;
            if (exactWorkshopMatch($existingWorkshop, $workshop)) {
                validationError('A submission for this normalized workshop already exists.', 'workshop');
            }
            if (uncertainWorkshopMatch($existingWorkshop, $workshop)) {
                $workshop['duplicateReview'] = true;
            }
        }

        $entry = [
            'id'       => 'sub-' . date('Ymd-His') . '-' . substr(bin2hex(random_bytes(4)), 0, 6),
            'status'   => 'pending',
            'kind'     => $kind,
            'target'   => $target,
            'ts'       => time(),
            'received' => date('c'),
            'by'       => ipHash(),
            'workshop' => $workshop,
        ];
        $rows[] = $entry;
        if (!writeAll($rows)) {
            return ['ok' => false, 'status' => 500, 'error' => 'Could not write to data/pending-submissions.json — check folder permissions.'];
        }
        return ['ok' => true, 'id' => $entry['id'], 'pending' => count($rows)];
    });
    if (!($result['ok'] ?? false)) out(['ok' => false, 'error' => $result['error']], (int)($result['status'] ?? 500));
    out($result);
}

// ---- PUBLIC: visitor edits their own still-pending submission ------------
if ($action === 'edit-own') {
    requirePost();
    $id = $decoded['id'] ?? '';
    $incoming = $decoded['workshop'] ?? null;
    if (!is_string($id) || !preg_match('/^sub-\d{8}-\d{6}-[a-f0-9]{6}$/', $id)) {
        validationError('Invalid submission ID.', 'id');
    }
    if (!is_array($incoming)) {
        validationError('Workshop data is required.', 'workshop');
    }

    $allowedWorkshopFields = [
        'id', 'name', 'type', 'emirate', 'phone', 'makes', 'insurers',
        'address', 'hours', 'notes', 'email', 'kind', 'target', 'duplicateReview'
    ];
    $unknown = array_diff(array_keys($incoming), $allowedWorkshopFields);
    if ($unknown) {
        validationError('Unknown workshop field: ' . (string)reset($unknown) . '.');
    }

    $name = validateString(
        $incoming['name'] ?? null, 'Workshop name', MAX_LENGTHS['name'], true,
        '/^[\p{L}\p{N}][\p{L}\p{N}\p{M}\s&().,\-\/+\'’]*$/u'
    );
    $type = validateString($incoming['type'] ?? null, 'Workshop type', 20, true, '/^[a-z]+$/');
    if (!in_array($type, WORKSHOP_TYPES, true)) {
        validationError('Workshop type must be agency or nonagency.', 'type');
    }
    $emirate = validateString($incoming['emirate'] ?? null, 'Emirate', 30, true, '/^[\p{L}\s-]+$/u');
    if (!in_array($emirate, EMIRATES, true)) {
        validationError('Invalid UAE emirate.', 'emirate');
    }
    $address = validateString(
        $incoming['address'] ?? null, 'Address', MAX_LENGTHS['address'], false,
        '/^[\p{L}\p{N}\p{M}\s#&().,\-\/+:;\'’]*$/u'
    );
    $hours = validateString(
        $incoming['hours'] ?? null, 'Hours', MAX_LENGTHS['hours'], false,
        '/^[\p{L}\p{N}\p{M}\s#&().,\-\/+:;\'’]*$/u'
    );
    $notes = validateString(
        $incoming['notes'] ?? null, 'Notes', MAX_LENGTHS['notes'], false,
        '/^[\p{L}\p{N}\p{M}\s#&().,\-\/+:;!?%\'’]*$/u'
    );
    $phone = normalizePhone($incoming['phone'] ?? null, false);
    $email = validateEmail($incoming['email'] ?? null, false);
    $makes = validateList($incoming['makes'] ?? null, 'Makes', MAX_LENGTHS['list'], 25, $type === 'agency', ALLOWED_MAKES);
    $insurers = validateList($incoming['insurers'] ?? null, 'Insurers', MAX_LENGTHS['insurer'], 25, $type === 'nonagency', ALLOWED_INSURERS);

    $result = withStateLock(function() use ($id, $name, $type, $emirate, $address, $hours, $notes, $phone, $email, $makes, $insurers) {
        $rows = readAll();
        $idx = null;
        foreach ($rows as $i => $r) { if (($r['id'] ?? '') === $id) { $idx = $i; break; } }
        if ($idx === null) {
            return ['ok' => false, 'status' => 404, 'error' => 'Submission not found.'];
        }
        $row = $rows[$idx];

        // Only the original submitter (by IP hash, same trust model as the
        // rate limiter above) may edit, and only while still pending review.
        if (($row['by'] ?? '') !== ipHash()) {
            return ['ok' => false, 'status' => 403, 'error' => 'This submission was not made from this connection.'];
        }
        if (($row['status'] ?? 'pending') !== 'pending') {
            return ['ok' => false, 'status' => 409, 'error' => 'This submission has already been reviewed and can no longer be edited.'];
        }

        $base = is_array($row['workshop'] ?? null) ? $row['workshop'] : [];
        $workshop = [
            'id'       => is_string($base['id'] ?? null) ? $base['id'] : null,
            'name'     => $name,
            'type'     => $type,
            'emirate'  => $emirate,
            'address'  => $address,
            'phone'    => $phone,
            'hours'    => $hours,
            'notes'    => $notes,
            'makes'    => $makes,
            'insurers' => $insurers,
            'duplicateReview' => false,
        ];
        if ($email !== '') $workshop['email'] = $email;

        foreach ($rows as $i => $existing) {
            if ($i === $idx) continue;
            $existingWorkshop = is_array($existing['workshop'] ?? null) ? $existing['workshop'] : [];
            if (trim((string)($existingWorkshop['name'] ?? '')) === '') continue;
            if (exactWorkshopMatch($existingWorkshop, $workshop)) {
                return ['ok' => false, 'status' => 422, 'error' => 'Another submission already matches these details.'];
            }
            if (uncertainWorkshopMatch($existingWorkshop, $workshop)) {
                $workshop['duplicateReview'] = true;
            }
        }

        $rows[$idx]['workshop'] = $workshop;
        $rows[$idx]['received'] = date('c');
        $rows[$idx]['ts'] = time();
        if (!writeAll($rows)) {
            return ['ok' => false, 'status' => 500, 'error' => 'Could not save your changes — check folder permissions.'];
        }
        if (!recordAuditUnlocked($id, 'edit-own', 'pending', 'pending', [])) {
            return ['ok' => false, 'status' => 500, 'error' => 'Changes saved but the audit log could not be written.'];
        }
        return ['ok' => true, 'workshop' => $workshop];
    });
    if (!($result['ok'] ?? false)) out(['ok' => false, 'error' => $result['error']], (int)($result['status'] ?? 500));
    out($result);
}

// ---- PUBLIC: status of a visitor's own submissions -----------------------
/* A device keeps its own submissions in localStorage so they show while
   awaiting review. Nothing on the server can reach into that storage, so
   without this the device would keep showing a workshop after the owner
   rejected it or removed it from the directory. The client asks here and
   drops anything no longer pending. Only a status is returned, and only
   for an exact submission id, so this leaks nothing a guesser could use. */
if ($action === 'submission-status') {
    requirePost();
    $ids = $decoded['ids'] ?? null;
    if (!is_array($ids)) validationError('A list of submission ids is required.', 'ids');
    if (count($ids) > 50) validationError('Too many submission ids in one request.', 'ids');
    $rows = readAll();
    $statuses = [];
    foreach ($ids as $rawId) {
        if (!is_string($rawId) || !preg_match('/^sub-\d{8}-\d{6}-[a-f0-9]{6}$/', $rawId)) continue;
        $found = null;
        foreach ($rows as $r) { if (($r['id'] ?? '') === $rawId) { $found = $r; break; } }
        // A row that is gone entirely was deleted, published-then-removed, or
        // cleared. Either way the device should stop showing it.
        $statuses[$rawId] = $found === null ? 'missing' : (string)($found['status'] ?? 'pending');
    }
    out(['ok' => true, 'statuses' => $statuses]);
}

// ---- PUBLIC: published dataset -------------------------------------------
if ($action === 'published') {
    if ($method !== 'GET') requirePost();
    $rows = readPublished();
    out(['ok' => true, 'workshops' => $rows, 'count' => count($rows)]);
}

// ---- ADMIN: list everything ----------------------------------------------
if ($action === 'list') {
    requireAdminSession();
    $rows = readAll();
    foreach ($rows as &$r) unset($r['by']);
    unset($r);
    out(['ok' => true, 'rows' => array_reverse($rows)]);
}


// ---- ADMIN: audit log ----------------------------------------------------
if ($action === 'audit-list') {
    requireAdminSession();
    out(['ok' => true, 'rows' => array_reverse(readAudit())]);
}

// ---- ADMIN: list verification metadata ----------------------------------
if ($action === 'verification-list') {
    requireAdminSession();
    out(['ok' => true, 'workshops' => readPublished(), 'verification' => readVerification()]);
}

// ---- ADMIN: update workshop verification --------------------------------
if ($action === 'verification') {
    requirePost(); requireCsrf();
    $id=$decoded['id']??''; $status=$decoded['status']??'';
    if(!is_string($id)||!preg_match('/^ws_[a-f0-9]{8}$/',$id))validationError('Invalid workshop ID.','id');
    if(!is_string($status)||!in_array($status,['verified','outdated','review'],true))validationError('Verification status must be verified, outdated, or review.','status');
    $result=withStateLock(function() use($id,$status){
        $pub=readPublished(); $oldPub=$pub; $registry=readVerification(); $oldRegistry=$registry;
        $found=false; $old='review'; $oldDate=''; $source='Existing directory data';
        foreach($pub as &$w){if(($w['id']??'')===$id){$found=true;$old=(string)($w['verificationStatus']??'review');$oldDate=(string)($w['lastVerified']??'');$source=(string)($w['source']??$source);$w['verificationStatus']=$status;$w['lastVerified']=$status==='verified'?date('Y-m-d'):$oldDate;break;}} unset($w);
        if(!$found)return ['ok'=>false,'status'=>404,'error'=>'Published workshop not found.'];
        $registry[$id]=['lastVerified'=>$status==='verified'?date('Y-m-d'):$oldDate,'verificationStatus'=>$status,'source'=>$source];
        if(!writePublished($pub) || !writeVerification($registry)){writePublished($oldPub);writeVerification($oldRegistry);return ['ok'=>false,'status'=>500,'error'=>'Could not save verification state; changes were rolled back.'];}
        if(!recordAuditUnlocked($id,'edit',$old,$status,['operation'=>'verification','verificationStatus'=>$status]))return ['ok'=>false,'status'=>500,'error'=>'Verification changed but audit log could not be written.'];
        return ['ok'=>true,'id'=>$id,'metadata'=>$registry[$id]];
    });
    out($result,(int)($result['status']??200));
}

// ---- ADMIN: approve ------------------------------------------------------
if ($action === 'approve') {
    requirePost(); requireCsrf();
    $id=$decoded['id']??''; if(!is_string($id)||!preg_match('/^sub-\d{8}-\d{6}-[a-f0-9]{6}$/',$id))validationError('Invalid submission ID.','id');
    $result=withStateLock(function() use($id){
        $rows=readAll(); $found=false; $prev='pending'; $kind='new';
        foreach($rows as &$r){if(($r['id']??'')===$id){$found=true;$prev=(string)($r['status']??'pending');$kind=(string)($r['kind']??'new');if($prev!=='pending')return ['ok'=>false,'status'=>422,'error'=>'Only pending submissions can be approved.'];$r['status']='approved';break;}} unset($r);
        if(!$found)return ['ok'=>false,'status'=>404,'error'=>'Submission not found.'];
        if(!writeAll($rows))return ['ok'=>false,'status'=>500,'error'=>'Could not save.'];
        if(!recordAuditUnlocked($id,'approve',$prev,'approved',['kind'=>$kind]))return ['ok'=>false,'status'=>500,'error'=>'Approval saved but audit log could not be written.'];
        return ['ok'=>true];
    });
    out($result,(int)($result['status']??200));
}

// ---- ADMIN: reject -------------------------------------------------------
if ($action === 'reject') {
    requirePost(); requireCsrf();
    $id=$decoded['id']??''; if(!is_string($id)||!preg_match('/^sub-\d{8}-\d{6}-[a-f0-9]{6}$/',$id))validationError('Invalid submission ID.','id');
    $result=withStateLock(function() use($id){
        $rows=readAll(); $found=false; $prev='pending';
        foreach($rows as &$r){if(($r['id']??'')===$id){$found=true;$prev=(string)($r['status']??'pending');$r['status']='rejected';break;}} unset($r);
        if(!$found)return ['ok'=>false,'status'=>404,'error'=>'Submission not found.'];
        if(!writeAll($rows))return ['ok'=>false,'status'=>500,'error'=>'Could not save.'];
        if(!recordAuditUnlocked($id,'reject',$prev,'rejected',[]))return ['ok'=>false,'status'=>500,'error'=>'Rejection saved but audit log could not be written.'];
        return ['ok'=>true];
    });
    out($result,(int)($result['status']??200));
}

// ---- ADMIN: edit ---------------------------------------------------------
if ($action === 'edit') {
    requirePost(); requireCsrf();
    $id=$decoded['id']??''; $incoming=$decoded['workshop']??null;
    if(!is_string($id)||!preg_match('/^sub-\d{8}-\d{6}-[a-f0-9]{6}$/',$id))validationError('Invalid submission ID.','id');
    if(!is_array($incoming))validationError('Workshop data is required.','workshop');
    $result=withStateLock(function() use($id,$incoming){
        $rows=readAll(); $idx=null; foreach($rows as $i=>$r)if(($r['id']??'')===$id){$idx=$i;break;}
        if($idx===null)return ['ok'=>false,'status'=>404,'error'=>'Submission not found.'];
        $old=$rows[$idx]; $base=$old['workshop']??[]; $merged=array_merge($base,$incoming);
        $name=validateString($merged['name']??null,'Workshop name',MAX_LENGTHS['name'],true,'/^[\p{L}\p{N}][\p{L}\p{N}\p{M}\s&().,\-\/+\'’]*$/u');
        $type=validateString($merged['type']??null,'Workshop type',20,true,'/^[a-z]+$/'); if(!in_array($type,WORKSHOP_TYPES,true))validationError('Invalid workshop type.','type');
        $emirate=validateString($merged['emirate']??null,'Emirate',30,true,'/^[\p{L}\s-]+$/u'); if(!in_array($emirate,EMIRATES,true))validationError('Invalid UAE emirate.','emirate');
        $address=validateString($merged['address']??null,'Address',MAX_LENGTHS['address'],false,'/^[\p{L}\p{N}\p{M}\s#&().,\-\/+::;\'’]*$/u');
        $phone=normalizePhone($merged['phone']??null,false); $hours=validateString($merged['hours']??null,'Hours',MAX_LENGTHS['hours'],false,'/^[\p{L}\p{N}\p{M}\s#&().,\-\/+::;\'’]*$/u'); $notes=validateString($merged['notes']??null,'Notes',MAX_LENGTHS['notes'],false,'/^[\p{L}\p{N}\p{M}\s#&().,\-\/+::;!?%\'’]*$/u'); $email=validateEmail($merged['email']??null,false);
        $makes=validateList($merged['makes']??null,'Makes',MAX_LENGTHS['list'],25,$type==='agency',ALLOWED_MAKES); $insurers=validateList($merged['insurers']??null,'Insurers',MAX_LENGTHS['insurer'],25,$type==='nonagency',ALLOWED_INSURERS);
        $updated=['id'=>stableWorkshopId(['id'=>$base['id']??null,'name'=>$name,'emirate'=>$emirate,'phone'=>$phone,'address'=>$address]),'name'=>$name,'type'=>$type,'makes'=>$makes,'insurers'=>$type==='nonagency'?$insurers:[],'emirate'=>$emirate,'address'=>$address,'phone'=>$phone,'hours'=>$hours,'notes'=>$notes,'lastVerified'=>(string)($base['lastVerified']??''),'verificationStatus'=>(string)($base['verificationStatus']??'review'),'source'=>(string)($base['source']??'User submission'),'duplicateReview'=>false]; if($email!=='')$updated['email']=$email;
        $rows[$idx]['workshop']=$updated;
        if(!writeAll($rows))return ['ok'=>false,'status'=>500,'error'=>'Could not save.'];
        $changed=[]; foreach(['name','type','emirate','address','phone','hours','notes','makes','insurers','email'] as $f){if(($base[$f]??null)!==($updated[$f]??null))$changed[]=$f;}
        if(!recordAuditUnlocked($id,'edit',(string)($old['status']??'pending'),(string)($old['status']??'pending'),['changedFields'=>$changed]))return ['ok'=>false,'status'=>500,'error'=>'Edit saved but audit log could not be written.'];
        return ['ok'=>true,'workshop'=>$updated];
    });
    out($result,(int)($result['status']??200));
}

// ---- ADMIN: publish ------------------------------------------------------
if ($action === 'publish') {
    requirePost(); requireCsrf();
    $id=$decoded['id']??''; if(!is_string($id)||!preg_match('/^sub-\d{8}-\d{6}-[a-f0-9]{6}$/',$id))validationError('Invalid submission ID.','id');
    $result=withStateLock(function() use($id){
        $rows=readAll(); $idx=null; foreach($rows as $i=>$r)if(($r['id']??'')===$id){$idx=$i;break;}
        if($idx===null)return ['ok'=>false,'status'=>404,'error'=>'Submission not found.'];
        $r=$rows[$idx]; if(($r['status']??'')!=='approved')return ['ok'=>false,'status'=>422,'error'=>'Submission must be manually approved before publication.'];
        $w=$r['workshop']??[]; if(!is_array($w))validationError('Submission workshop data is invalid.','workshop');
        $pubBefore=readPublished(); foreach($pubBefore as $existing){if(exactWorkshopMatch($existing,$w))validationError('An exact normalized workshop already exists in the published dataset.','workshop'); if(uncertainWorkshopMatch($existing,$w))validationError('This workshop resembles a published record and requires additional review before publication.','workshop');}
        $w['id']=stableWorkshopId($w); $w['publishedAt']=date('c'); $w['source']=$w['source']??'Approved submission'; $w['verificationStatus']=$w['verificationStatus']??'review'; $pubAfter=$pubBefore; $pubAfter[]=$w;
        $pendingAfter=$rows; $pendingAfter[$idx]['status']='published'; $pendingAfter[$idx]['publishedAt']=$w['publishedAt'];
        if(!publishAtomically($rows,$pendingAfter,$pubBefore,$pubAfter))return ['ok'=>false,'status'=>500,'error'=>'Publication failed; no success was reported and the datasets were rolled back.'];
        if(!recordAuditUnlocked($id,'publish','approved','published',['workshopId'=>$w['id']]))return ['ok'=>false,'status'=>500,'error'=>'Publication saved but audit log could not be written.'];
        return ['ok'=>true,'workshop'=>$w];
    });
    out($result,(int)($result['status']??200));
}

// Deliberately no per-submission 'delete' action here. A submission row —
// pending, approved, published, or rejected — is never removable from the
// queue by any action in this file. It is the only record of when and what
// was submitted. To take a published workshop off the live site, use
// 'delete-published' below, which touches only the published dataset and
// leaves the originating submission row untouched.

// ---- ADMIN: remove a published workshop from the live directory ----------
// This is deliberately the ONLY removal path anywhere in this file. Queue
// records (pending-submissions.json, any status) are never deleted, cleared,
// or otherwise erased by any action — see the removed 'delete'/'clear' block
// below for why. This action only ever touches the live published dataset
// and its verification entry; the originating submission row stays exactly
// as it is, permanently, as the record of when and what was submitted.
if ($action === 'delete-published') {
    requirePost(); requireCsrf();
    $id = $decoded['id'] ?? '';
    if (!is_string($id) || !preg_match('/^ws_[a-f0-9]{8}$/', $id)) {
        validationError('Invalid workshop ID.', 'id');
    }
    $result = withStateLock(function() use ($id) {
        $pubBefore = readPublished();
        $pubAfter = [];
        $removed = null;
        foreach ($pubBefore as $w) {
            if (($w['id'] ?? '') === $id && $removed === null) { $removed = $w; continue; }
            $pubAfter[] = $w;
        }
        if ($removed === null) {
            return ['ok' => false, 'status' => 404, 'error' => 'Published workshop not found.'];
        }

        if (!writePublished($pubAfter)) {
            return ['ok' => false, 'status' => 500, 'error' => 'Could not save; the directory was not changed.'];
        }

        // Verification metadata is a side registry, not the source of truth.
        // Cleaned up after the published dataset commits; a stale key here
        // is harmless, so a failure here is not worth rolling back for.
        $registry = readVerification();
        if (array_key_exists($id, $registry)) {
            unset($registry[$id]);
            writeVerification($registry);
        }

        if (!recordAuditUnlocked($id, 'delete-published', 'published', 'unlisted', [
            'name' => (string)($removed['name'] ?? '')
        ])) {
            return ['ok' => false, 'status' => 500, 'error' => 'Workshop removed but audit log could not be written.'];
        }
        return ['ok' => true, 'id' => $id, 'remaining' => count($pubAfter)];
    });
    out($result, (int)($result['status'] ?? 200));
}

// Deliberately no bulk 'clear'/'clear-handled' action here, for the same
// reason 'delete' is gone above: rejected and published rows are history,
// not clutter, and are kept indefinitely.

validationError('Unknown action.', 'action');
