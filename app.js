// ڕێکخستنەکانی پەیوەندی بە فایەربەیس
const firebaseConfig = {
    apiKey: "AIzaSyC2539t0L3Zms_jd7Z_qzJrzSV2dU_viS4",
    authDomain: "persson-database.firebaseapp.com",
    projectId: "persson-database",
    storageBucket: "persson-database.firebasestorage.app",
    messagingSenderId: "1002896345987",
    appId: "1:1002896345987:web:4bb12ac4c5d13fba0c44b6",
    measurementId: "G-5PC29H4823"
};

// دەستپێکردنی فایەربەیس
firebase.initializeApp(firebaseConfig);

// گرتنی ڕیفرێنسی داتابەیس
const db = firebase.firestore();
const personsCollection = db.collection('persons');

// گۆڕاوەکانی پەیج کردن
let currentPage = 1;
const itemsPerPage = 25;
let allData = [];

// کاتێک پەڕەکە ئامادە دەبێت
document.addEventListener('DOMContentLoaded', function() {
    // بەڕێوەبردنی فۆرمی گەڕان
    document.getElementById('searchBtn').addEventListener('click', searchPersons);
    document.getElementById('showAllBtn').addEventListener('click', loadAllPersons);
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedPersons);
    document.getElementById('exportCSVBtn').addEventListener('click', exportToCSV);
    document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
    
    // بەڕێوەبردنی فۆرمی زیادکردن
    document.getElementById('addPersonForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewPerson();
    });
    
    // بەڕێوەبردنی فۆرمی گۆڕین
    document.getElementById('findForEditBtn').addEventListener('click', findPersonForEdit);
    document.getElementById('editPersonForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updatePerson();
    });
    document.getElementById('deletePersonBtn').addEventListener('click', deleteCurrentPerson);
    
    // بەڕێوەبردنی ڕاپۆرتەکان
    document.getElementById('countryReportBtn').addEventListener('click', generateCountryReport);
    document.getElementById('missingDataReportBtn').addEventListener('click', generateMissingDataReport);
    document.getElementById('exportFullReportBtn').addEventListener('click', exportFullReport);
    document.getElementById('printReportBtn').addEventListener('click', printReport);
    document.getElementById('monthlyReportBtn').addEventListener('click', generateMonthlyReport);
    
    // بەڕێوەبردنی Model
    document.getElementById('editFromDetailsBtn').addEventListener('click', editFromDetails);
    
    // باکردنی هەموو داتا لە سەرەتاوە
    loadAllPersons();
});

// فەنکشنی پیشاندانی ئاگادارکردنەوە
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `alert alert-${type}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// فەنکشنی گەڕان
function searchPersons() {
    const searchField = document.getElementById('searchField').value;
    const searchValue = document.getElementById('searchValue').value.trim();
    
    if (!searchValue) {
        showNotification('تکایە وشەی گەڕان داخل بکە', 'warning');
        return;
    }
    
    document.getElementById('searchLoading').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    
    let query;
    
    if (searchField === 'Persson_ID') {
        // گەڕان بەپێی ID
        query = personsCollection.where(searchField, '==', parseInt(searchValue) || searchValue);
    } else {
        // گەڕان بەپێی تێکست
        query = personsCollection.where(searchField, '>=', searchValue)
                                 .where(searchField, '<=', searchValue + '\uf8ff');
    }
    
    query.get().then((querySnapshot) => {
        allData = [];
        querySnapshot.forEach((doc) => {
            allData.push({id: doc.id, ...doc.data()});
        });
        
        currentPage = 1;
        renderResults();
        document.getElementById('searchLoading').style.display = 'none';
        document.getElementById('searchResults').style.display = 'block';
        
        showNotification(`${allData.length} ئەنجام دۆزرایەوە`);
    }).catch((error) => {
        console.error("هەڵە لە گەڕان: ", error);
        document.getElementById('searchLoading').style.display = 'none';
        document.getElementById('searchResults').style.display = 'block';
        showNotification('هەڵەیەک ڕوویدا لە کاتی گەڕان', 'danger');
    });
}

// فەنکشنی بارکردنی هەموو کەسەکان
function loadAllPersons() {
    document.getElementById('searchLoading').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    
    personsCollection.get().then((querySnapshot) => {
        allData = [];
        querySnapshot.forEach((doc) => {
            allData.push({id: doc.id, ...doc.data()});
        });
        
        currentPage = 1;
        renderResults();
        document.getElementById('searchLoading').style.display = 'none';
        document.getElementById('searchResults').style.display = 'block';
        
        showNotification(`${allData.length} کەس بارکرا`);
    }).catch((error) => {
        console.error("هەڵە لە بارکردنی داتا: ", error);
        document.getElementById('searchLoading').style.display = 'none';
        document.getElementById('searchResults').style.display = 'block';
        showNotification('هەڵەیەک ڕوویدا لە کاتی بارکردنی داتا', 'danger');
    });
}

// فەنکشنی پیشاندانی ئەنجامەکان
function renderResults() {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (allData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center">هیچ ئەنجامێک نەدۆزرایەوە</td></tr>`;
        return;
    }
    
    // دیاریکردنی ژمارەی پەیجەکان
    const totalPages = Math.ceil(allData.length / itemsPerPage);
    
    // دڵنیابوون لە سنووری پەیج
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    
    // دیاریکردنی داتای پەیجی ئێستا
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = allData.slice(start, end);
    
    // دروستکردنی ڕیزەکان
    pageData.forEach((person) => {
        const row = document.createElement('tr');
        
        // خانەی چێکبۆکس
        const checkboxCell = document.createElement('td');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'person-checkbox';
        checkbox.value = person.id;
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);
        
        // خانەی ID
        const idCell = document.createElement('td');
        idCell.textContent = person.Persson_ID;
        row.appendChild(idCell);
        
        // خانەی ناو
        const nameCell = document.createElement('td');
        nameCell.textContent = person.Naw || '';
        row.appendChild(nameCell);
        
        // خانەی لۆگۆ
        const logoCell = document.createElement('td');
        logoCell.textContent = person.Logo || '';
        row.appendChild(logoCell);
        
        // خانەی مۆبایل
        const mobileCell = document.createElement('td');
        mobileCell.textContent = person.Mobil || '';
        row.appendChild(mobileCell);
        
        // خانەی ئیمەیڵ
        const emailCell = document.createElement('td');
        emailCell.textContent = person.emaill || '';
        row.appendChild(emailCell);
        
        // خانەی وڵات
        const countryCell = document.createElement('td');
        countryCell.textContent = person.Country || '';
        row.appendChild(countryCell);
        
        // خانەی کۆدی ZMC
        const zmcCell = document.createElement('td');
        zmcCell.textContent = person.ZMC_code || '';
        row.appendChild(zmcCell);
        
        // خانەی کردارەکان
        const actionsCell = document.createElement('td');
        
        // دوگمەی بینین
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-sm btn-info me-1';
        viewBtn.textContent = 'بینین';
        viewBtn.addEventListener('click', () => viewPersonDetails(person));
        actionsCell.appendChild(viewBtn);
        
        // دوگمەی گۆڕین
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm btn-warning me-1';
        editBtn.textContent = 'گۆڕین';
        editBtn.addEventListener('click', () => editPerson(person));
        actionsCell.appendChild(editBtn);
        
        // دوگمەی سڕینەوە
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-sm btn-danger';
        deleteBtn.textContent = 'سڕینەوە';
        deleteBtn.addEventListener('click', () => deletePerson(person.id, person.Naw));
        actionsCell.appendChild(deleteBtn);
        
        row.appendChild(actionsCell);
        
        tbody.appendChild(row);
    });
    
    // دروستکردنی پەیجنەیشن
    if (totalPages > 1) {
        // دوگمەی پەیجی پێشوو
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        const prevLink = document.createElement('a');
        prevLink.className = 'page-link';
        prevLink.href = '#';
        prevLink.textContent = 'پێشوو';
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                renderResults();
            }
        });
        prevLi.appendChild(prevLink);
        pagination.appendChild(prevLi);
        
        // دوگمەکانی پەیج
        for (let i = 1; i <= totalPages; i++) {
            // ئەگەر پەیجەکان زۆرن، هەندێکیان نیشان مەدە
            if (totalPages > 7) {
                if (i !== 1 && i !== totalPages && (i < currentPage - 1 || i > currentPage + 1)) {
                    if (i === currentPage - 2 || i === currentPage + 2) {
                        const ellipsisLi = document.createElement('li');
                        ellipsisLi.className = 'page-item disabled';
                        const ellipsisLink = document.createElement('a');
                        ellipsisLink.className = 'page-link';
                        ellipsisLink.href = '#';
                        ellipsisLink.textContent = '...';
                        ellipsisLi.appendChild(ellipsisLink);
                        pagination.appendChild(ellipsisLi);
                    }
                    continue;
                }
            }
            
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
            const pageLink = document.createElement('a');
            pageLink.className = 'page-link';
            pageLink.href = '#';
            pageLink.textContent = i;
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                currentPage = i;
                renderResults();
            });
            pageLi.appendChild(pageLink);
            pagination.appendChild(pageLi);
        }
        
        // دوگمەی پەیجی داهاتوو
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        const nextLink = document.createElement('a');
        nextLink.className = 'page-link';
        nextLink.href = '#';
        nextLink.textContent = 'داهاتوو';
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                renderResults();
            }
        });
        nextLi.appendChild(nextLink);
        pagination.appendChild(nextLi);
    }
}

// فەنکشنی هەڵبژاردنی هەموو
function toggleSelectAll() {
    const isChecked = document.getElementById('selectAll').checked;
    const checkboxes = document.querySelectorAll('.person-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
    });
}

// فەنکشنی سڕینەوەی هەڵبژێردراوەکان
function deleteSelectedPersons() {
    const selectedCheckboxes = document.querySelectorAll('.person-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) {
        showNotification('هیچ کەسێک هەڵنەبژێردراوە', 'warning');
        return;
    }
    
    if (!confirm(`ئایا دڵنیایت لە سڕینەوەی ${selectedCheckboxes.length} کەس؟`)) {
        return;
    }
    
    const batch = db.batch();
    selectedCheckboxes.forEach(checkbox => {
        const personId = checkbox.value;
        const personRef = personsCollection.doc(personId);
        batch.delete(personRef);
    });
    
    batch.commit().then(() => {
        showNotification(`${selectedCheckboxes.length} کەس سڕایەوە`, 'success');
        loadAllPersons();
    }).catch(error => {
        console.error("هەڵە لە سڕینەوەی کەسەکان: ", error);
        showNotification('هەڵەیەک ڕوویدا لە کاتی سڕینەوەدا', 'danger');
    });
}

// فەنکشنی هەناردن بۆ CSV
function exportToCSV() {
    if (allData.length === 0) {
        showNotification('هیچ داتایەک نییە بۆ هەناردن', 'warning');
        return;
    }
    
    // دروستکردنی سەری فایلەکە
    let csvContent = 'ID,ناو,لۆگۆ,مۆبایل,مۆبایلی دووەم,ئیمەیڵ,وڵات,کۆدی ZMC,وشەی نهێنی,ناوی ئینگلیزی,کۆدی کەس,پرۆفایلی PDF\n';
    
    // زیادکردنی داتاکان
    allData.forEach(person => {
        const row = [
            person.Persson_ID || '',
            `"${(person.Naw || '').replace(/"/g, '""')}"`,
            `"${(person.Logo || '').replace(/"/g, '""')}"`,
            `"${(person.Mobil || '').replace(/"/g, '""')}"`,
            `"${(person.Mobile2 || '').replace(/"/g, '""')}"`,
            `"${(person.emaill || '').replace(/"/g, '""')}"`,
            `"${(person.Country || '').replace(/"/g, '""')}"`,
            `"${(person.ZMC_code || '').replace(/"/g, '""')}"`,
            `"${(person.Password || '').replace(/"/g, '""')}"`,
            `"${(person.Name_en || '').replace(/"/g, '""')}"`,
            `"${(person.persson_code || '').replace(/"/g, '""')}"`,
            `"${(person.PDF_Profile || '').replace(/"/g, '""')}"`
        ].join(',');
        csvContent += row + '\n';
    });
    
    // دروستکردنی فایل بۆ داگرتن
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'persons_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('داتاکان هەناردران بۆ CSV', 'success');
}

// فەنکشنی بینینی وردەکاری کەس
function viewPersonDetails(person) {
    const modal = new bootstrap.Modal(document.getElementById('personDetailsModal'));
    const modalBody = document.getElementById('personDetailsBody');
    
    // دروستکردنی وردەکاری ناو Modal
    modalBody.innerHTML = `
        <div class="table-responsive">
            <table class="table table-bordered">
                <tr>
                    <th width="30%">شناسە (ID)</th>
                    <td>${person.Persson_ID || ''}</td>
                </tr>
                <tr>
                    <th>ناو</th>
                    <td>${person.Naw || ''}</td>
                </tr>
                <tr>
                    <th>ناوی ئینگلیزی</th>
                    <td>${person.Name_en || ''}</td>
                </tr>
                <tr>
                    <th>لۆگۆ</th>
                    <td>${person.Logo || ''}</td>
                </tr>
                <tr>
                    <th>مۆبایل</th>
                    <td>${person.Mobil || ''}</td>
                </tr>
                <tr>
                    <th>مۆبایلی دووەم</th>
                    <td>${person.Mobile2 || ''}</td>
                </tr>
                <tr>
                    <th>ئیمەیڵ</th>
                    <td>${person.emaill || ''}</td>
                </tr>
                <tr>
                    <th>وڵات</th>
                    <td>${person.Country || ''}</td>
                </tr>
                <tr>
                    <th>کۆدی ZMC</th>
                    <td>${person.ZMC_code || ''}</td>
                </tr>
                <tr>
                    <th>وشەی نهێنی</th>
                    <td>${person.Password || ''}</td>
                </tr>
                <tr>
                    <th>کۆدی کەس</th>
                    <td>${person.persson_code || ''}</td>
                </tr>
                <tr>
                    <th>پرۆفایلی PDF</th>
                    <td>${person.PDF_Profile || ''}</td>
                </tr>
            </table>
        </div>
    `;
    
    // هەڵگرتنی زانیاری کەس بۆ گۆڕین
    document.getElementById('editFromDetailsBtn').dataset.personId = person.id;
    
    // نیشاندانی Modal
    modal.show();
}

// فەنکشنی زیادکردنی کەس
function addNewPerson() {
    // وەرگرتنی بەهاکان لە فۆڕمەکە
    const newPerson = {
        Persson_ID: Date.now(), // ID ی کاتی
        Naw: document.getElementById('addNaw').value,
        Name_en: document.getElementById('addNameEn').value,
        Logo: document.getElementById('addLogo').value,
        Mobil: document.getElementById('addMobil').value,
        Mobile2: document.getElementById('addMobile2').value,
        emaill: document.getElementById('addEmail').value,
        Country: document.getElementById('addCountry').value,
        ZMC_code: document.getElementById('addZMCCode').value,
        Password: document.getElementById('addPassword').value,
        persson_code: document.getElementById('addPersonCode').value,
        PDF_Profile: document.getElementById('addPDFProfile').value
    };
    
    // زیادکردن بۆ داتابەیس
    personsCollection.add(newPerson)
        .then((docRef) => {
            showNotification('کەس بە سەرکەوتوویی زیادکرا', 'success');
            document.getElementById('addPersonForm').reset();
        })
        .catch((error) => {
            console.error("هەڵە لە زیادکردنی کەس: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی زیادکردنی کەسدا', 'danger');
        });
}

// فەنکشنی دۆزینەوەی کەس بۆ گۆڕین
function findPersonForEdit() {
    const personID = document.getElementById('editSearchID').value.trim();
    
    if (!personID) {
        showNotification('تکایە ID داخل بکە', 'warning');
        return;
    }
    
    document.getElementById('editLoading').style.display = 'block';
    document.getElementById('editPersonForm').style.display = 'none';
    
    // گەڕان بەپێی ID
    personsCollection.where('Persson_ID', '==', parseInt(personID) || personID).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                showNotification('هیچ کەسێک نەدۆزرایەوە بەم ID یە', 'warning');
                document.getElementById('editLoading').style.display = 'none';
                return;
            }
            
            // وەرگرتنی زانیاری کەسەکە
            const personData = querySnapshot.docs[0].data();
            const personId = querySnapshot.docs[0].id;
            
            // پڕکردنەوەی فۆڕمەکە بە زانیاری کەسەکە
            document.getElementById('editID').value = personId;
            document.getElementById('editNaw').value = personData.Naw || '';
            document.getElementById('editNameEn').value = personData.Name_en || '';
            document.getElementById('editLogo').value = personData.Logo || '';
            document.getElementById('editMobil').value = personData.Mobil || '';
            document.getElementById('editMobile2').value = personData.Mobile2 || '';
            document.getElementById('editEmail').value = personData.emaill || '';
            document.getElementById('editCountry').value = personData.Country || '';
            document.getElementById('editZMCCode').value = personData.ZMC_code || '';
            document.getElementById('editPassword').value = personData.Password || '';
            document.getElementById('editPersonCode').value = personData.persson_code || '';
            document.getElementById('editPDFProfile').value = personData.PDF_Profile || '';
            
            // نیشاندانی فۆڕمەکە
            document.getElementById('editLoading').style.display = 'none';
            document.getElementById('editPersonForm').style.display = 'block';
        })
        .catch((error) => {
            console.error("هەڵە لە دۆزینەوەی کەس: ", error);
            document.getElementById('editLoading').style.display = 'none';
            showNotification('هەڵەیەک ڕوویدا لە کاتی دۆزینەوەی کەسدا', 'danger');
        });
}

// فەنکشنی نوێکردنەوەی کەس
function updatePerson() {
    const personId = document.getElementById('editID').value;
    
    if (!personId) {
        showNotification('هیچ کەسێک دیاری نەکراوە بۆ نوێکردنەوە', 'warning');
        return;
    }
    
    // وەرگرتنی بەهاکان لە فۆڕمەکە
    const updatedPerson = {
        Naw: document.getElementById('editNaw').value,
        Name_en: document.getElementById('editNameEn').value,
        Logo: document.getElementById('editLogo').value,
        Mobil: document.getElementById('editMobil').value,
        Mobile2: document.getElementById('editMobile2').value,
        emaill: document.getElementById('editEmail').value,
        Country: document.getElementById('editCountry').value,
        ZMC_code: document.getElementById('editZMCCode').value,
        Password: document.getElementById('editPassword').value,
        persson_code: document.getElementById('editPersonCode').value,
        PDF_Profile: document.getElementById('editPDFProfile').value
    };
    
    // نوێکردنەوەی داتاکان لە داتابەیس
    personsCollection.doc(personId).update(updatedPerson)
        .then(() => {
            showNotification('زانیاری کەس بە سەرکەوتوویی نوێکرایەوە', 'success');
            document.getElementById('editPersonForm').reset();
            document.getElementById('editPersonForm').style.display = 'none';
            document.getElementById('editSearchID').value = '';
        })
        .catch((error) => {
            console.error("هەڵە لە نوێکردنەوەی کەس: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی نوێکردنەوەی کەسدا', 'danger');
        });
}

// فەنکشنی سڕینەوەی کەسی ئێستا
function deleteCurrentPerson() {
    const personId = document.getElementById('editID').value;
    
    if (!personId) {
        showNotification('هیچ کەسێک دیاری نەکراوە بۆ سڕینەوە', 'warning');
        return;
    }
    
    if (!confirm('ئایا دڵنیایت لە سڕینەوەی ئەم کەسە؟')) {
        return;
    }
    
    personsCollection.doc(personId).delete()
        .then(() => {
            showNotification('کەس بە سەرکەوتوویی سڕایەوە', 'success');
            document.getElementById('editPersonForm').reset();
            document.getElementById('editPersonForm').style.display = 'none';
            document.getElementById('editSearchID').value = '';
        })
        .catch((error) => {
            console.error("هەڵە لە سڕینەوەی کەس: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی سڕینەوەی کەسدا', 'danger');
        });
}

// فەنکشنی سڕینەوەی کەس لە لیستەکە
function deletePerson(personId, personName) {
    if (!confirm(`ئایا دڵنیایت لە سڕینەوەی کەسی "${personName}"؟`)) {
        return;
    }
    
    personsCollection.doc(personId).delete()
        .then(() => {
            showNotification('کەس بە سەرکەوتوویی سڕایەوە', 'success');
            loadAllPersons();
        })
        .catch((error) => {
            console.error("هەڵە لە سڕینەوەی کەس: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی سڕینەوەی کەسدا', 'danger');
        });
}

// فەنکشنی گۆڕینی کەس لە وردەکارییەوە
function editFromDetails() {
    const personId = document.getElementById('editFromDetailsBtn').dataset.personId;
    
    if (!personId) {
        showNotification('هیچ کەسێک دیاری نەکراوە بۆ گۆڕین', 'warning');
        return;
    }
    
    // داخستنی Modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('personDetailsModal'));
    modal.hide();
    

    // دۆزینەوەی زانیاری کەس و پڕکردنەوەی فۆڕمی گۆڕین
    personsCollection.doc(personId).get()
        .then((doc) => {
            if (doc.exists) {
                const personData = doc.data();
                
                // گۆڕینی تاب بۆ تابی گۆڕین
                document.querySelector('#edit-tab').click();
                
                // پڕکردنەوەی فۆڕمەکە بە زانیاری کەسەکە
                document.getElementById('editID').value = personId;
                document.getElementById('editNaw').value = personData.Naw || '';
                document.getElementById('editNameEn').value = personData.Name_en || '';
                document.getElementById('editLogo').value = personData.Logo || '';
                document.getElementById('editMobil').value = personData.Mobil || '';
                document.getElementById('editMobile2').value = personData.Mobile2 || '';
                document.getElementById('editEmail').value = personData.emaill || '';
                document.getElementById('editCountry').value = personData.Country || '';
                document.getElementById('editZMCCode').value = personData.ZMC_code || '';
                document.getElementById('editPassword').value = personData.Password || '';
                document.getElementById('editPersonCode').value = personData.persson_code || '';
                document.getElementById('editPDFProfile').value = personData.PDF_Profile || '';
                
                // نیشاندانی فۆڕمەکە
                document.getElementById('editPersonForm').style.display = 'block';
                document.getElementById('editSearchID').value = personData.Persson_ID || '';
            } else {
                showNotification('کەسەکە نەدۆزرایەوە', 'warning');
            }
        })
        .catch((error) => {
            console.error("هەڵە لە دۆزینەوەی کەس: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی دۆزینەوەی کەسدا', 'danger');
        });
}

// فەنکشنی دروستکردنی ڕاپۆرتی کەسەکان بەپێی وڵات
function generateCountryReport() {
    personsCollection.get()
        .then((querySnapshot) => {
            // وەرگرتنی داتا
            const countries = {};
            
            querySnapshot.forEach((doc) => {
                const person = doc.data();
                const country = person.Country || 'نادیار';
                
                if (countries[country]) {
                    countries[country]++;
                } else {
                    countries[country] = 1;
                }
            });
            
            // دروستکردنی داتا بۆ چارت
            const labels = Object.keys(countries);
            const data = Object.values(countries);
            
            // دروستکردنی چارت
            const chartCanvas = document.getElementById('countryReportChart');
            
            // سڕینەوەی هەر چارتێکی پێشوو
            if (window.countryChart) {
                window.countryChart.destroy();
            }
            
            window.countryChart = new Chart(chartCanvas, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'ژمارەی کەسەکان',
                        data: data,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    }
                }
            });
            
            showNotification('ڕاپۆرتی وڵات دروست کرا', 'success');
        })
        .catch((error) => {
            console.error("هەڵە لە دروستکردنی ڕاپۆرت: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی دروستکردنی ڕاپۆرتدا', 'danger');
        });
}

// فەنکشنی دروستکردنی ڕاپۆرتی زانیاری ناتەواو
function generateMissingDataReport() {
    personsCollection.get()
        .then((querySnapshot) => {
            // وەرگرتنی داتا
            let totalPersons = querySnapshot.size;
            let missingEmail = 0;
            let missingMobile = 0;
            let missingLogo = 0;
            let missingCountry = 0;
            
            querySnapshot.forEach((doc) => {
                const person = doc.data();
                
                if (!person.emaill || person.emaill === '') {
                    missingEmail++;
                }
                
                if (!person.Mobil || person.Mobil === '') {
                    missingMobile++;
                }
                
                if (!person.Logo || person.Logo === '') {
                    missingLogo++;
                }
                
                if (!person.Country || person.Country === '') {
                    missingCountry++;
                }
            });
            
            // دروستکردنی داتا بۆ چارت
            const labels = ['بێ ئیمەیڵ', 'بێ مۆبایل', 'بێ لۆگۆ', 'بێ وڵات'];
            const data = [missingEmail, missingMobile, missingLogo, missingCountry];
            const percentages = data.map(val => (val / totalPersons * 100).toFixed(1));
            
            // دروستکردنی چارت
            const chartCanvas = document.getElementById('missingDataReportChart');
            
            // سڕینەوەی هەر چارتێکی پێشوو
            if (window.missingDataChart) {
                window.missingDataChart.destroy();
            }
            
            window.missingDataChart = new Chart(chartCanvas, {
                type: 'pie',
                data: {
                    labels: labels.map((label, index) => `${label} (${percentages[index]}%)`),
                    datasets: [{
                        data: data,
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.7)',
                            'rgba(54, 162, 235, 0.7)',
                            'rgba(255, 206, 86, 0.7)',
                            'rgba(75, 192, 192, 0.7)'
                        ],
                        borderColor: [
                            'rgba(255, 99, 132, 1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw} کەس`;
                                }
                            }
                        }
                    }
                }
            });
            
            showNotification('ڕاپۆرتی زانیاری ناتەواو دروست کرا', 'success');
        })
        .catch((error) => {
            console.error("هەڵە لە دروستکردنی ڕاپۆرت: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی دروستکردنی ڕاپۆرتدا', 'danger');
        });
}

// فەنکشنی هەناردنی ڕاپۆرتی تەواو
function exportFullReport() {
    // داوا لە بەکارهێنەر بکە چاوەڕێ بکات
    showNotification('دروستکردنی ڕاپۆرتی PDF، تکایە چاوەڕێ بکە...', 'info');
    
    personsCollection.get()
        .then((querySnapshot) => {
            // دروستکردنی زانیاری گشتی
            let totalPersons = querySnapshot.size;
            let countriesCount = {};
            let missingFieldsCount = {
                email: 0,
                mobile: 0,
                logo: 0,
                country: 0
            };
            
            querySnapshot.forEach((doc) => {
                const person = doc.data();
                
                // وڵاتەکان
                const country = person.Country || 'نادیار';
                countriesCount[country] = (countriesCount[country] || 0) + 1;
                
                // زانیاری ناتەواو
                if (!person.emaill || person.emaill === '') {
                    missingFieldsCount.email++;
                }
                
                if (!person.Mobil || person.Mobil === '') {
                    missingFieldsCount.mobile++;
                }
                
                if (!person.Logo || person.Logo === '') {
                    missingFieldsCount.logo++;
                }
                
                if (!person.Country || person.Country === '') {
                    missingFieldsCount.country++;
                }
            });
            
            // دروستکردنی HTML بۆ ڕاپۆرت
            let reportContent = `
                <html dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>ڕاپۆرتی تەواوی سیستەمی کەسەکان</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 20px;
                            direction: rtl;
                        }
                        h1, h2, h3 {
                            color: #333;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: right;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        .section {
                            margin-bottom: 30px;
                        }
                        .summary-box {
                            background-color: #f9f9f9;
                            border: 1px solid #ddd;
                            padding: 15px;
                            border-radius: 5px;
                            margin-bottom: 20px;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            font-size: 12px;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <h1>ڕاپۆرتی تەواوی سیستەمی کەسەکان</h1>
                    <p>بەرواری ڕاپۆرت: ${new Date().toLocaleDateString('ku-IQ')}</p>
                    
                    <div class="section">
                        <div class="summary-box">
                            <h2>کورتەی زانیارییەکان</h2>
                            <p>کۆی گشتی کەسەکان: <strong>${totalPersons}</strong></p>
                            <p>ژمارەی وڵاتەکان: <strong>${Object.keys(countriesCount).length}</strong></p>
                            <p>کەسەکان بێ ئیمەیڵ: <strong>${missingFieldsCount.email}</strong> (${((missingFieldsCount.email/totalPersons)*100).toFixed(1)}%)</p>
                            <p>کەسەکان بێ مۆبایل: <strong>${missingFieldsCount.mobile}</strong> (${((missingFieldsCount.mobile/totalPersons)*100).toFixed(1)}%)</p>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h2>دابەشبوونی کەسەکان بەپێی وڵات</h2>
                        <table>
                            <tr>
                                <th>وڵات</th>
                                <th>ژمارەی کەسەکان</th>
                                <th>ڕێژە</th>
                            </tr>
                            ${Object.entries(countriesCount)
                                .sort((a, b) => b[1] - a[1])
                                .map(([country, count]) => `
                                    <tr>
                                        <td>${country}</td>
                                        <td>${count}</td>
                                        <td>${((count/totalPersons)*100).toFixed(1)}%</td>
                                    </tr>
                                `).join('')
                            }
                        </table>
                    </div>
                    
                    <div class="section">
                        <h2>ڕاپۆرتی زانیاری ناتەواو</h2>
                        <table>
                            <tr>
                                <th>زانیاری ناتەواو</th>
                                <th>ژمارەی کەسەکان</th>
                                <th>ڕێژە</th>
                            </tr>
                            <tr>
                                <td>بێ ئیمەیڵ</td>
                                <td>${missingFieldsCount.email}</td>
                                <td>${((missingFieldsCount.email/totalPersons)*100).toFixed(1)}%</td>
                            </tr>
                            <tr>
                                <td>بێ مۆبایل</td>
                                <td>${missingFieldsCount.mobile}</td>
                                <td>${((missingFieldsCount.mobile/totalPersons)*100).toFixed(1)}%</td>
                            </tr>
                            <tr>
                                <td>بێ لۆگۆ</td>
                                <td>${missingFieldsCount.logo}</td>
                                <td>${((missingFieldsCount.logo/totalPersons)*100).toFixed(1)}%</td>
                            </tr>
                            <tr>
                                <td>بێ وڵات</td>
                                <td>${missingFieldsCount.country}</td>
                                <td>${((missingFieldsCount.country/totalPersons)*100).toFixed(1)}%</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="footer">
                        <p>ئەم ڕاپۆرتە بە شێوەی ئۆتۆماتیکی دروستکراوە لە سیستەمی بەڕێوەبردنی زانیاری کەسەکان</p>
                    </div>
                </body>
                </html>
            `;
            
            // دروستکردنی بلۆب و پیشاندانی لە تابێکی نوێ
            const blob = new Blob([reportContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            showNotification('ڕاپۆرتی تەواو دروست کرا', 'success');
        })
        .catch((error) => {
            console.error("هەڵە لە دروستکردنی ڕاپۆرت: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی دروستکردنی ڕاپۆرتدا', 'danger');
        });
}

// فەنکشنی چاپکردنی لیستی کەسەکان
function printReport() {
    // داوا لە بەکارهێنەر بکە چاوەڕێ بکات
    showNotification('ئامادەکردنی لیستی چاپکردن، تکایە چاوەڕێ بکە...', 'info');
    
    personsCollection.get()
        .then((querySnapshot) => {
            let persons = [];
            querySnapshot.forEach((doc) => {
                persons.push({id: doc.id, ...doc.data()});
            });
            
            // دروستکردنی HTML بۆ چاپکردن
            let printContent = `
                <html dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>لیستی کەسەکان</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 20px;
                            direction: rtl;
                        }
                        h1 {
                            text-align: center;
                            margin-bottom: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: right;
                            font-size: 14px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .footer {
                            margin-top: 20px;
                            text-align: center;
                            font-size: 12px;
                        }
                        @media print {
                            .no-print {
                                display: none;
                            }
                            body {
                                margin: 0;
                                padding: 10px;
                            }
                            th {
                                background-color: #f2f2f2 !important;
                                -webkit-print-color-adjust: exact;
                            }
                            tr:nth-child(even) {
                                background-color: #f9f9f9 !important;
                                -webkit-print-color-adjust: exact;
                            }
                        }
                    </style>
                </head>
                <body>
                    <button class="no-print" onclick="window.print()">چاپکردن</button>
                    <h1>لیستی کەسەکان</h1>
                    <p>بەرواری چاپکردن: ${new Date().toLocaleDateString('ku-IQ')} | کۆی گشتی: ${persons.length} کەس</p>
                    
                    <table>
                        <tr>
                            <th>ژمارە</th>
                            <th>ID</th>
                            <th>ناو</th>
                            <th>مۆبایل</th>
                            <th>ئیمەیڵ</th>
                            <th>وڵات</th>
                            <th>کۆدی ZMC</th>
                        </tr>
                        ${persons.map((person, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${person.Persson_ID || ''}</td>
                                <td>${person.Naw || ''}</td>
                                <td>${person.Mobil || ''}</td>
                                <td>${person.emaill || ''}</td>
                                <td>${person.Country || ''}</td>
                                <td>${person.ZMC_code || ''}</td>
                            </tr>
                        `).join('')}
                    </table>
                    
                    <div class="footer">
                        <p>ئەم لیستە لە سیستەمی بەڕێوەبردنی زانیاری کەسەکان دروستکراوە</p>
                    </div>
                    
                    <script>
                        // چاپکردنی ئۆتۆماتیکی
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        };
                    </script>
                </body>
                </html>
            `;
            
            // کردنەوەی تابێکی نوێ بۆ چاپکردن
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            showNotification('لیستی چاپکردن ئامادە کرا', 'success');
        })
        .catch((error) => {
            console.error("هەڵە لە ئامادەکردنی چاپکردن: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی ئامادەکردنی چاپکردن', 'danger');
        });
}

// فەنکشنی دروستکردنی ڕاپۆرتی مانگانە
function generateMonthlyReport() {
    // داوا لە بەکارهێنەر بکە چاوەڕێ بکات
    showNotification('دروستکردنی ڕاپۆرتی مانگانە، تکایە چاوەڕێ بکە...', 'info');
    
    // ئێستا ئێمە جۆرێکی مانگانەمان نییە (لە داتابەیس)، بۆیە دروستی دەکەین
    // لە داهاتوودا دەتوانیت فیلتەری بەپێی بەروار زیاد بکەیت
    
    personsCollection.get()
        .then((querySnapshot) => {
            let persons = [];
            querySnapshot.forEach((doc) => {
                persons.push({id: doc.id, ...doc.data()});
            });
            
            // ڕێکخستنی داتاکان بەپێی وڵات
            const countrySummary = {};
            persons.forEach(person => {
                const country = person.Country || 'نادیار';
                if (!countrySummary[country]) {
                    countrySummary[country] = {
                        total: 0,
                        withEmail: 0,
                        withMobile: 0
                    };
                }
                
                countrySummary[country].total++;
                
                if (person.emaill && person.emaill.trim() !== '') {
                    countrySummary[country].withEmail++;
                }
                
                if (person.Mobil && person.Mobil.trim() !== '') {
                    countrySummary[country].withMobile++;
                }
            });
            
            // دروستکردنی HTML بۆ ڕاپۆرت
            const currentDate = new Date();
            const monthNames = [
                'ڕێبەندان', 'ڕەشەمێ', 'خاکەلێوە', 'گوڵان', 'جۆزەردان', 'پووشپەڕ',
                'گەلاوێژ', 'خەرمانان', 'ڕەزبەر', 'گەڵاڕێزان', 'سەرماوەز', 'بەفرانبار'
            ];
            
            let reportContent = `
                <html dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>ڕاپۆرتی مانگانەی سیستەمی کەسەکان</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            margin: 20px;
                            direction: rtl;
                        }
                        h1, h2, h3 {
                            color: #333;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            padding-bottom: 10px;
                            border-bottom: 2px solid #ddd;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: right;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                        tr:nth-child(even) {
                            background-color: #f9f9f9;
                        }
                        .section {
                            margin-bottom: 30px;
                        }
                        .summary-box {
                            background-color: #f9f9f9;
                            border: 1px solid #ddd;
                            padding: 15px;
                            border-radius: 5px;
                            margin-bottom: 20px;
                        }
                        .footer {
                            margin-top: 30px;
                            text-align: center;
                            font-size: 12px;
                            color: #666;
                            padding-top: 10px;
                            border-top: 1px solid #ddd;
                        }
                        .print-btn {
                            background-color: #4CAF50;
                            color: white;
                            padding: 10px 20px;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 16px;
                            margin-bottom: 20px;
                        }
                        @media print {
                            .print-btn {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <button class="print-btn" onclick="window.print()">چاپکردنی ڕاپۆرت</button>
                    
                    <div class="header">
                        <h1>ڕاپۆرتی مانگانەی سیستەمی کەسەکان</h1>
                        <h2>مانگی ${monthNames[currentDate.getMonth()]} ساڵی ${currentDate.getFullYear()}</h2>
                        <p>بەرواری دروستکردن: ${currentDate.toLocaleDateString('ku-IQ')}</p>
                    </div>
                    
                    <div class="section">
                        <div class="summary-box">
                            <h3>کورتەی ڕاپۆرت</h3>
                            <p>کۆی گشتی کەسەکان: <strong>${persons.length}</strong></p>
                            <p>ژمارەی وڵاتەکان: <strong>${Object.keys(countrySummary).length}</strong></p>
                            <p>ڕێژەی تەواوبوونی زانیاری: <strong>${calculateCompletionRate(persons)}%</strong></p>
                        </div>
                    </div>
                    
                    <div class="section">
                        <h3>کورتەی وڵاتەکان</h3>
                        <table>
                            <tr>
                                <th>وڵات</th>
                                <th>کۆی گشتی</th>
                                <th>بە ئیمەیڵ</th>
                                <th>بە مۆبایل</th>
                                <th>ڕێژەی تەواوی</th>
                            </tr>
                            ${Object.entries(countrySummary)
                                .sort((a, b) => b[1].total - a[1].total)
                                .map(([country, data]) => {
                                    const completionRate = ((data.withEmail + data.withMobile) / (data.total * 2) * 100).toFixed(1);
                                    return `
                                        <tr>
                                            <td>${country}</td>
                                            <td>${data.total}</td>
                                            <td>${data.withEmail} (${((data.withEmail/data.total)*100).toFixed(1)}%)</td>
                                            <td>${data.withMobile} (${((data.withMobile/data.total)*100).toFixed(1)}%)</td>
                                            <td>${completionRate}%</td>
                                        </tr>
                                    `;
                                }).join('')
                            }
                        </table>
                    </div>
                    
                    <div class="section">
                        <h3>پێشنیارەکان بۆ مانگی داهاتوو</h3>
                        <ul>
                            <li>تەواوکردنی زانیاری کەسەکان، بەتایبەت ئیمەیڵ و ژمارەی مۆبایل.</li>
                            <li>پێداچوونەوە بە زانیاری کەسەکانی وڵاتی ${getLargestCountry(countrySummary)}.</li>
                            <li>زیادکردنی فیلتەری گەڕانی پێشکەوتوو.</li>
                        </ul>
                    </div>
                    
                    <div class="footer">
                        <p>ئەم ڕاپۆرتە بە شێوەی ئۆتۆماتیکی د
                        روستکراوە لە سیستەمی بەڕێوەبردنی زانیاری کەسەکان</p>
                        <p>ژمارەی لاپەڕە: 1/1</p>
                    </div>
                    <script>
                        function calculateCompletionRate(persons) {
                            let totalFields = persons.length * 2; // ئیمەیڵ و مۆبایل بۆ هەر کەسێک
                            let completedFields = 0;
                            
                            persons.forEach(person => {
                                if (person.emaill && person.emaill.trim() !== '') {
                                    completedFields++;
                                }
                                if (person.Mobil && person.Mobil.trim() !== '') {
                                    completedFields++;
                                }
                            });
                            
                            return (completedFields / totalFields * 100).toFixed(1);
                        }
                        
                        function getLargestCountry(countrySummary) {
                            let largestCountry = '';
                            let largestCount = 0;
                            
                            for (const country in countrySummary) {
                                if (countrySummary[country].total > largestCount) {
                                    largestCount = countrySummary[country].total;
                                    largestCountry = country;
                                }
                            }
                            
                            return largestCountry;
                        }
                    </script>
                </body>
                </html>
            `;
            
            // کردنەوەی تابێکی نوێ بۆ ڕاپۆرت
            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(reportContent);
            reportWindow.document.close();
            
            showNotification('ڕاپۆرتی مانگانە دروست کرا', 'success');
        })
        .catch((error) => {
            console.error("هەڵە لە دروستکردنی ڕاپۆرت: ", error);
            showNotification('هەڵەیەک ڕوویدا لە کاتی دروستکردنی ڕاپۆرت', 'danger');
        });
}

// فەنکشنەکانی یارمەتیدەر
function editPerson(person) {
    // گۆڕینی تاب بۆ تابی گۆڕین
    document.querySelector('#edit-tab').click();
    
    // پڕکردنەوەی فۆڕمەکە بە زانیاری کەسەکە
    document.getElementById('editID').value = person.id;
    document.getElementById('editNaw').value = person.Naw || '';
    document.getElementById('editNameEn').value = person.Name_en || '';
    document.getElementById('editLogo').value = person.Logo || '';
    document.getElementById('editMobil').value = person.Mobil || '';
    document.getElementById('editMobile2').value = person.Mobile2 || '';
    document.getElementById('editEmail').value = person.emaill || '';
    document.getElementById('editCountry').value = person.Country || '';
    document.getElementById('editZMCCode').value = person.ZMC_code || '';
    document.getElementById('editPassword').value = person.Password || '';
    document.getElementById('editPersonCode').value = person.persson_code || '';
    document.getElementById('editPDFProfile').value = person.PDF_Profile || '';
    
    // نیشاندانی فۆڕمەکە
    document.getElementById('editPersonForm').style.display = 'block';
    document.getElementById('editSearchID').value = person.Persson_ID || '';
}

// فەنکشنی دروستکردنی فایەربەیس کۆنفیگ لە ڕێگای فۆڕمێکەوە (بژاردەیی)
function setupFirebaseConfig() {
    // تەنها ئەگەر کۆنفیگ نەدرابێت
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') {
        // دروستکردنی Modal بۆ وەرگرتنی زانیاریەکان
        const configModal = `
            <div class="modal fade" id="configModal" tabindex="-1" data-bs-backdrop="static" aria-labelledby="configModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="configModalLabel">ڕێکخستنی فایەربەیس</h5>
                        </div>
                        <div class="modal-body">
                            <p>تکایە زانیاری ڕێکخستنی فایەربەیست داخل بکە. ئەم زانیاریانە لە ڕێکخستنەکانی پڕۆژەکەت لە کۆنسۆڵی فایەربەیس دەست دەکەون.</p>
                            
                            <form id="configForm">
                                <div class="mb-3">
                                    <label for="apiKey" class="form-label">API Key</label>
                                    <input type="text" class="form-control" id="apiKey" required>
                                </div>
                                <div class="mb-3">
                                    <label for="authDomain" class="form-label">Auth Domain</label>
                                    <input type="text" class="form-control" id="authDomain" required>
                                </div>
                                <div class="mb-3">
                                    <label for="projectId" class="form-label">Project ID</label>
                                    <input type="text" class="form-control" id="projectId" required>
                                </div>
                                <div class="mb-3">
                                    <label for="storageBucket" class="form-label">Storage Bucket</label>
                                    <input type="text" class="form-control" id="storageBucket" required>
                                </div>
                                <div class="mb-3">
                                    <label for="messagingSenderId" class="form-label">Messaging Sender ID</label>
                                    <input type="text" class="form-control" id="messagingSenderId" required>
                                </div>
                                <div class="mb-3">
                                    <label for="appId" class="form-label">App ID</label>
                                    <input type="text" class="form-control" id="appId" required>
                                </div>
                                
                                <button type="submit" class="btn btn-primary">پاشەکەوتکردن و دەستپێکردن</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // زیادکردنی Modal بۆ DOM
        document.body.insertAdjacentHTML('beforeend', configModal);
        
        // پیشاندانی Modal
        const modal = new bootstrap.Modal(document.getElementById('configModal'));
        modal.show();
        
        // بەڕێوەبردنی فۆڕمەکە
        document.getElementById('configForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // وەرگرتنی بەهاکان لە فۆڕمەکە
            const newConfig = {
                apiKey: document.getElementById('apiKey').value,
                authDomain: document.getElementById('authDomain').value,
                projectId: document.getElementById('projectId').value,
                storageBucket: document.getElementById('storageBucket').value,
                messagingSenderId: document.getElementById('messagingSenderId').value,
                appId: document.getElementById('appId').value
            };
            
            // پاشەکەوتکردنی کۆنفیگ لە localStorage
            localStorage.setItem('firebaseConfig', JSON.stringify(newConfig));
            
            // ڕیلۆدکردنی پەڕە بۆ پەیڕەوکردنی کۆنفیگی نوێ
            window.location.reload();
        });
        
        return false; // فایەربەیس ئامادە نییە
    }
    
    return true; // فایەربەیس ئامادەیە
}

// چێککردنی localStorage بۆ کۆنفیگی پاشەکەوتکراو
function loadSavedConfig() {
    const savedConfig = localStorage.getItem('firebaseConfig');
    
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            
            // جێگرتنەوەی کۆنفیگی default
            Object.assign(firebaseConfig, config);
            
            return true;
        } catch (error) {
            console.error("هەڵە لە خوێندنەوەی کۆنفیگی پاشەکەوتکراو:", error);
            localStorage.removeItem('firebaseConfig'); // سڕینەوەی کۆنفیگی هەڵە
        }
    }
    
    return false;
}

// فەنکشنی وەرگێڕان (بژاردەیی بۆ پاڵپشتی چەند زمانێک)
function translate(key) {
    const translations = {
        'ku': {
            'search': 'گەڕان',
            'add': 'زیادکردن',
            'edit': 'گۆڕین',
            'delete': 'سڕینەوە',
            'view': 'بینین',
            'name': 'ناو',
            'mobile': 'مۆبایل',
            'email': 'ئیمەیڵ',
            'country': 'وڵات',
            'save': 'پاشەکەوتکردن',
            'cancel': 'هەڵوەشاندنەوە',
            'noResults': 'هیچ ئەنجامێک نەدۆزرایەوە',
            'confirmDelete': 'ئایا دڵنیایت لە سڕینەوە؟',
            'success': 'سەرکەوتوو بوو',
            'error': 'هەڵەیەک ڕوویدا'
        },
        'en': {
            'search': 'Search',
            'add': 'Add',
            'edit': 'Edit',
            'delete': 'Delete',
            'view': 'View',
            'name': 'Name',
            'mobile': 'Mobile',
            'email': 'Email',
            'country': 'Country',
            'save': 'Save',
            'cancel': 'Cancel',
            'noResults': 'No results found',
            'confirmDelete': 'Are you sure you want to delete?',
            'success': 'Success',
            'error': 'An error occurred'
        }
    };
    
    // زمانی بنەڕەتی
    const lang = 'ku';
    
    return translations[lang][key] || key;
}

// دەستپێکردنی پێویست بۆ سیستەمەکە
function initializeSystem() {
    // چێککردنی کۆنفیگی پاشەکەوتکراو
    if (!loadSavedConfig()) {
        // ئەگەر کۆنفیگی پاشەکەوتکراو نەبوو، هەوڵی دروستکردنی کۆنفیگی فایەربەیس بدە
        if (!setupFirebaseConfig()) {
            // هیچ کردار نەکە - Modal ی وەرگرتنی کۆنفیگ پیشان دەدرێت
            return;
        }
    }
    
    // دەستپێکردنی فایەربەیس
    try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        personsCollection = db.collection('persons');
        
        // باکردنی هەموو داتا لە سەرەتاوە
        loadAllPersons();
    } catch (error) {
        console.error("هەڵە لە دەستپێکردنی فایەربەیس:", error);
        showNotification('هەڵەیەک ڕوویدا لە پەیوەندیکردن بە فایەربەیس. تکایە دووبارە هەوڵ بدەوە.', 'danger');
    }
}

// بەکارهێنانی فەنکشنی دەستپێکردن دوای باربوونی DOM
// document.addEventListener('DOMContentLoaded', initializeSystem);