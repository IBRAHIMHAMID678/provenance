# EVALUATION METHODOLOGY & BENCHMARKING PROTOCOL
## Insurance Document Intelligence Lab

### 1. Ground Truth Principles
1. **Gold Standard Verification**: A ground-truth annotation is considered gold standard only when created by a human annotator and verified by a supervisor.
2. **Never Predict as Ground Truth**: Machine extraction predictions must never automatically populate or contaminate evaluation datasets.
3. **Partition Isolation**: The dataset is split into `Train` (40%), `Validation` (30%), and `Held-Out Test` (30%). Held-out test documents are strictly isolated and never used for prompt engineering or routing calibration.

---

### 2. Scientific Metrics & Mathematical Definitions

#### A. Field-Level Exact Accuracy ($A_{exact}$)
$$\text{Accuracy}_{exact} = \frac{\sum_{i=1}^{N} \mathbb{I}(\text{Extracted}_i = \text{GroundTruth}_i)}{N}$$
Where equality requires character-exact match after basic whitespace normalization.

#### B. Normalized Value Accuracy ($A_{norm}$)
Applies domain-aware canonicalizers before comparison:
- Dates: Formatted to ISO-8601 (`YYYY-MM-DD`).
- Currencies & Amounts: Converted to IEEE-754 floats rounded to 2 decimal places with separate ISO currency code matching.
- Names & Identifiers: Lowercased, stripped of non-alphanumeric punctuation.

#### C. Field Precision, Recall, and F1
$$\text{Precision} = \frac{TP}{TP + FP}, \quad \text{Recall} = \frac{TP}{TP + FN}, \quad F_1 = \frac{2 \cdot P \cdot R}{P + R}$$
- **True Positive (TP)**: Field is present in ground truth and correctly extracted.
- **False Positive (FP)**: Field is hallucinated (extracted when absent or extracted with incorrect value).
- **False Negative (FN)**: Field is present in ground truth but marked missing or unextracted.

#### D. Critical Field Accuracy ($A_{critical}$)
Evaluated exclusively over operational core fields:
- `claim_id` / `policy_number`
- `claim_amount` / `total_amount`
- `incident_date` / `filing_date`
- `claimant_name` / `policyholder_name`

#### E. Hallucination Rate ($H_{rate}$)
$$\text{Hallucination Rate} = \frac{\text{Count of Confidently Extracted Fields with Zero Ground-Truth Match}}{\text{Total Extracted Fields}}$$

#### F. Cost per Correct Field ($C_{CF}$)
$$C_{CF} = \frac{\text{Total Machine API \& Compute Cost} + \text{Total Human Review Labor Cost}}{\text{Total Count of Correctly Extracted Applicable Fields}}$$
*When correct fields = 0, $C_{CF} = \infty$. Zero division is explicitly guarded against.*

---

### 3. Fair Benchmarking Controls
To ensure comparability across extraction methods:
1. Every method in a comparative run receives the exact same document IDs.
2. The same normalization rules and ground truth versions are applied across all methods.
3. Errors, timeouts, and OCR failures count as 0 correct fields with full elapsed cost recorded—they are **never** dropped to artificially inflate percentage scores.
4. Latency is measured at median (P50), 90th percentile (P90), and 95th percentile (P95).

