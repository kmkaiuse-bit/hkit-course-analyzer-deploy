/**
 * 進階匯出管理模組
 * 從 test-ui.html 整合而來，提供專業的 Excel 和 PDF 匯出功能
 */

const AdvancedExporter = {
    /**
     * 初始化進階匯出管理器
     */
    init() {
        this.setupEventListeners();
        console.log('✅ AdvancedExporter initialized');
        
        // 測試按鈕是否存在
        this.checkButtons();
    },

    /**
     * 檢查按鈕是否存在（用於除錯）
     */
    checkButtons() {
        const csvBtn = document.getElementById('downloadBtn');
        const excelBtn = document.getElementById('downloadExcelBtn');
        const pdfBtn = document.getElementById('downloadPdfBtn');
        
        console.log('🔍 檢查匯出按鈕狀態:');
        console.log('  CSV 按鈕:', csvBtn ? '✅ 存在' : '❌ 不存在');
        console.log('  Excel 按鈕:', excelBtn ? '✅ 存在' : '❌ 不存在');
        console.log('  PDF 按鈕:', pdfBtn ? '✅ 存在' : '❌ 不存在');
        
        if (csvBtn) console.log('  CSV 按鈕當前顯示狀態:', csvBtn.style.display);
        if (excelBtn) console.log('  Excel 按鈕當前顯示狀態:', excelBtn.style.display);
        if (pdfBtn) console.log('  PDF 按鈕當前顯示狀態:', pdfBtn.style.display);
    },

    /**
     * 設置事件監聽器
     */
    setupEventListeners() {
        // Excel 匯出按鈕
        const excelBtn = document.getElementById('downloadExcelBtn');
        if (excelBtn) {
            excelBtn.addEventListener('click', () => this.downloadExcelApplication());
        }

        // PDF 匯出按鈕
        const pdfBtn = document.getElementById('downloadPdfBtn');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', () => this.generatePdfApplication());
        }

        // 整合 CSV 匯出按鈕
        const csvBtn = document.getElementById('downloadBtn');
        if (csvBtn) {
            csvBtn.addEventListener('click', () => this.downloadIntegratedResults());
        }
    },

    /**
     * 下載整合學生資訊的分析結果 (CSV)
     */
    downloadIntegratedResults() {
        try {
            const currentData = this.getCurrentData();
            if (!currentData || currentData.length === 0) {
                alert('沒有可匯出的數據！');
                return;
            }

            const studentInfo = this.getStudentInfo();

            // 整合學生資訊到每一行
            const integratedData = currentData.map(row => ({
                'Student Name': studentInfo.name || '未填寫',
                'Application Number': studentInfo.applicationNumber || '未填寫',
                'Applied Programme': studentInfo.appliedProgramme || '未填寫',
                ...row
            }));

            // 生成 CSV 內容
            const headers = Object.keys(integratedData[0]);
            const csvHeaders = headers.map(h => `"${h}"`).join(',');
            const csvRows = integratedData.map(row => 
                headers.map(h => {
                    let value = row[h] || '';
                    // 清理 HTML 標籤（用於 Exemption Granted 欄位）
                    if (typeof value === 'string' && value.includes('<')) {
                        value = value.includes('✅') ? 'true' : 'false';
                    }
                    return `"${value.toString().replace(/"/g, '""')}"`;
                }).join(',')
            );
            
            const csvContent = [csvHeaders, ...csvRows].join('\n');

            // 下載檔案
            this.downloadFile(csvContent, 'text/csv', this.generateFilename('csv'));
            console.log('✅ CSV 匯出成功');

        } catch (error) {
            console.error('CSV 匯出失敗:', error);
            alert('CSV 匯出失敗，請重試');
        }
    },

    /**
     * 下載 Excel 格式的正式申請表
     */
    downloadExcelApplication() {
        try {
            const currentData = this.getCurrentData();
            if (!currentData || currentData.length === 0) {
                alert('沒有可匯出的數據！');
                return;
            }

            const studentInfo = this.getStudentInfo();

            // 檢查是否有 SheetJS
            if (typeof XLSX === 'undefined') {
                alert('Excel 匯出功能不可用，請確保 SheetJS 已載入');
                return;
            }

            // 使用 SheetJS 創建真正的 Excel 檔案
            const wb = {
                Sheets: {},
                SheetNames: ['HDC'],
                Props: {
                    Title: 'Application for Advanced Standing',
                    Subject: 'Course Exemption Analysis',
                    Author: 'HKIT Course Exemption System',
                    CreatedDate: new Date()
                }
            };

            const ws = {};
            
            // 學生資訊
            const studentName = studentInfo.name || '未填寫';
            const applicationNo = studentInfo.applicationNumber || '未填寫';
            const programme = studentInfo.appliedProgramme ? 
                studentInfo.appliedProgramme.replace('Higher Diploma in ', '') + ' Stream' : '未填寫';
            const currentYear = new Date().getFullYear();
            
            // 設定儲存格內容
            // 標題區域
            ws['A1'] = { v: 'APPLICATION FOR ADVANCED STANDING', t: 's' };
            
            // 學校資訊
            ws['A3'] = { v: 'Hong Kong Institute of Technology', t: 's' };
            ws['A4'] = { v: 'Higher Diploma of Science and Technology', t: 's' };
            
            // 學生資訊 - 表格格式
            ws['A6'] = { v: 'Name of Student: ', t: 's' };
            ws['B6'] = { v: studentName, t: 's' };
            ws['C6'] = { v: programme, t: 's' };
            
            ws['A7'] = { v: 'Intake Year (HKIT Higher Diploma): ', t: 's' };
            ws['B7'] = { v: `T${currentYear}C`, t: 's' };
            ws['C7'] = { v: 'Year 2', t: 's' };
            
            ws['A8'] = { v: 'Application No.: ', t: 's' };
            ws['B8'] = { v: applicationNo, t: 's' };
            
            // 說明文字
            ws['A10'] = { v: 'Total subjects require to study in Higher Diploma:', t: 's' };
            
            // 表格標題
            ws['A12'] = { v: 'HKIT Subject Code', t: 's' };
            ws['B12'] = { v: 'HKIT Subject Name', t: 's' };
            ws['C12'] = { v: 'Exemption Granted / study plan', t: 's' };
            ws['D12'] = { v: 'Subject Name of Previous Studies', t: 's' };
            
            // 課程資料
            let currentRow = 14; // 第14行開始放課程資料
            currentData.forEach((row, index) => {
                const isExempted = row['Exemption Granted'] === true || row['Exemption Granted'] === 'true';
                const exemptionStatus = row['Exemption Granted / study plan'] || (isExempted ? 'Exempted' : '');
                const previousStudies = row['Subject Name of Previous Studies'] === 'NA' ? '' : (row['Subject Name of Previous Studies'] || '');
                
                const cellRow = currentRow + index;
                const cellA = `A${cellRow}`;
                const cellB = `B${cellRow}`;
                const cellC = `C${cellRow}`;
                const cellD = `D${cellRow}`;
                
                ws[cellA] = { v: row['HKIT Subject Code'] || '', t: 's' };
                ws[cellB] = { v: row['HKIT Subject Name'] || '', t: 's' };
                ws[cellC] = { v: exemptionStatus, t: 's' };
                ws[cellD] = { v: previousStudies, t: 's' };
            });
            
            // 底部資訊
            const lastDataRow = currentRow + currentData.length;
            ws[`A${lastDataRow + 2}`] = { v: 'Total Units of Advanced Standing Approved:', t: 's' };
            ws[`A${lastDataRow + 4}`] = { v: 'Intake Level Approved:', t: 's' };
            ws[`A${lastDataRow + 5}`] = { v: '*delete as appropriate', t: 's' };
            ws[`A${lastDataRow + 7}`] = { v: 'Signature:', t: 's' };
            ws[`A${lastDataRow + 8}`] = { v: 'Programme Leader (Higher Diploma of Science and Technology)', t: 's' };
            
            // 設定工作表範圍
            const range = XLSX.utils.encode_range({
                s: { c: 0, r: 0 }, // A1
                e: { c: 6, r: lastDataRow + 8 } // G到最後一行
            });
            ws['!ref'] = range;
            
            // 設定合併儲存格
            ws['!merges'] = [
                // 標題
                { s: { c: 0, r: 0 }, e: { c: 6, r: 0 } }, // A1:G1
                // 學校資訊
                { s: { c: 0, r: 2 }, e: { c: 6, r: 2 } }, // A3:G3
                { s: { c: 0, r: 3 }, e: { c: 6, r: 3 } }, // A4:G4
            ];
            
            // 設定欄寬
            ws['!cols'] = [
                { wch: 15 }, // A: HKIT Subject Code
                { wch: 40 }, // B: HKIT Subject Name
                { wch: 20 }, // C: Exemption Granted / study plan
                { wch: 50 }, // D: Subject Name of Previous Studies
                { wch: 8 },  // E: Yes
                { wch: 8 },  // F: No
                { wch: 30 }  // G: Remarks
            ];
            
            // 將工作表加入工作簿
            wb.Sheets['HDC'] = ws;
            
            // 生成 Excel 檔案
            const excelBuffer = XLSX.write(wb, { 
                bookType: 'xlsx', 
                type: 'array',
                cellStyles: true,
                bookSST: false
            });
            
            // 下載檔案
            const blob = new Blob([excelBuffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            this.downloadBlob(blob, this.generateFilename('xlsx', 'Advanced-Standing-Application'));
            console.log('✅ Excel 申請表匯出成功');

        } catch (error) {
            console.error('Excel 匯出失敗:', error);
            alert('Excel 匯出失敗，請重試');
        }
    },

    /**
     * 生成PDF申請表
     */
    generatePdfApplication() {
        try {
            const currentData = this.getCurrentData();
            if (!currentData || currentData.length === 0) {
                alert('沒有可匯出的數據！');
                return;
            }

            const studentInfo = this.getStudentInfo();
            
            // 創建新的窗口用於PDF打印
            const printWindow = window.open('', '_blank', 'width=210mm,height=297mm');
            
            // 學生資訊
            const studentName = studentInfo.name || '未填寫';
            const applicationNo = studentInfo.applicationNumber || '未填寫';
            const programme = studentInfo.appliedProgramme ? 
                studentInfo.appliedProgramme.replace('Higher Diploma in ', '') + ' Stream' : '未填寫';
            const currentYear = new Date().getFullYear();
            
            // 統計豁免課程數
            const exemptedCount = currentData.filter(row => 
                row['Exemption Granted'] === true || row['Exemption Granted'] === 'true'
            ).length;
            
            // 生成HTML內容 - 完全按照學校格式要求
            const htmlContent = this.generatePdfHtmlContent(studentName, applicationNo, programme, currentYear, currentData);
            
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            // 等待內容載入後聚焦
            printWindow.onload = function() {
                setTimeout(function() {
                    printWindow.focus();
                }, 300);
            };
            
            console.log('✅ PDF申請表已生成');
            
        } catch (error) {
            console.error('PDF 生成失敗:', error);
            alert('PDF 生成失敗，請重試');
        }
    },

    /**
     * 生成 PDF HTML 內容
     */
    generatePdfHtmlContent(studentName, applicationNo, programme, currentYear, currentData) {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Advanced Standing Application - ${studentName}</title>
            <style>
                @page {
                    margin: 15mm;
                    size: A4;
                }
                body {
                    font-family: Arial, 'Microsoft YaHei', sans-serif;
                    font-size: 11px;
                    line-height: 1.2;
                    color: #000;
                    margin: 0;
                    padding: 0;
                }
                
                .header-section {
                    margin-bottom: 20px;
                }
                .main-title {
                    font-size: 16px;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 15px;
                    text-decoration: underline;
                }
                .school-info {
                    font-size: 13px;
                    font-weight: bold;
                    text-align: center;
                    margin-bottom: 5px;
                }
                .student-info-section {
                    margin: 15px 0;
                }
                .student-info-table {
                    border: 3px solid #000;
                    border-collapse: collapse;
                    margin: 15px 0;
                    width: 70%;
                    font-size: 11px;
                }
                .student-info-table td {
                    border: 1px solid #000;
                    padding: 8px 10px;
                    font-weight: normal;
                }
                .student-info-label {
                    background-color: #f8f8f8;
                    font-weight: bold;
                    width: 30%;
                }
                .total-subjects-line {
                    margin: 15px 0 10px 0;
                    font-weight: bold;
                }
                
                .course-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0 20px 0;
                    font-size: 10px;
                }
                .course-table th {
                    border: 1px solid #000;
                    padding: 6px 4px;
                    text-align: center;
                    vertical-align: middle;
                    font-weight: bold;
                    background-color: #f8f8f8;
                }
                .course-table td {
                    border: 1px solid #000;
                    padding: 6px 4px;
                    text-align: left;
                    vertical-align: top;
                    font-weight: normal;
                }
                .col-a { width: 15%; }
                .col-b { width: 35%; }
                .col-c { width: 18%; }
                .col-d { width: 32%; }
                
                .text-center { text-align: center; }
                .exempted-row { background-color: #ffffff; }
                .not-exempted-row { background-color: #ffffff; }
                
                .signature-section {
                    margin-top: 25px;
                    margin-bottom: 20px;
                }
                .signature-line {
                    border-bottom: 1px solid #000;
                    display: inline-block;
                    width: 300px;
                    margin-left: 10px;
                    margin-bottom: 0px;
                }
                .additional-info {
                    margin: 15px 0;
                    font-weight: normal;
                }
                .approval-section {
                    margin: 20px 0;
                }
                .note {
                    font-style: italic;
                    font-size: 9px;
                    margin: 5px 0;
                }
                .programme-leader {
                    text-align: left;
                    font-weight: bold;
                    margin-top: 15px;
                }
                
                @media print {
                    body { 
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .no-print { display: none; }
                    @page { margin: 15mm; }
                }
            </style>
        </head>
        <body>
            <div class="header-section">
                <div class="main-title">APPLICATION FOR ADVANCED STANDING</div>
                <div class="school-info">Hong Kong Institute of Technology</div>
                <div class="school-info">Higher Diploma of Science and Technology</div>
            </div>
            
            <div class="student-info-section">
                <table class="student-info-table">
                    <tr>
                        <td class="student-info-label">Name of Student:</td>
                        <td>${studentName}</td>
                        <td>${programme}</td>
                    </tr>
                    <tr>
                        <td class="student-info-label">Intake Year (HKIT Higher Diploma):</td>
                        <td>T${currentYear}C</td>
                        <td>Year 2</td>
                    </tr>
                    <tr>
                        <td class="student-info-label">Application No.:</td>
                        <td>${applicationNo}</td>
                        <td></td>
                    </tr>
                </table>
            </div>
            
            <div class="total-subjects-line">Total subjects require to study in Higher Diploma:</div>
            
            <table class="course-table">
                <thead>
                    <tr>
                        <th class="col-a">HKIT Subject Code</th>
                        <th class="col-b">HKIT Subject Name</th>
                        <th class="col-c">Exemption Granted / study plan</th>
                        <th class="col-d">Subject Name of Previous Studies</th>
                    </tr>
                </thead>
                <tbody>
                    ${currentData.map(row => {
                        const isExempted = row['Exemption Granted'] === true || row['Exemption Granted'] === 'true';
                        const exemptionStatus = row['Exemption Granted / study plan'] || (isExempted ? 'Exempted' : '');
                        const previousStudies = row['Subject Name of Previous Studies'] === 'NA' ? '' : (row['Subject Name of Previous Studies'] || '');
                        const rowClass = isExempted ? 'exempted-row' : 'not-exempted-row';
                        
                        return `
                            <tr class="${rowClass}">
                                <td class="col-a">${row['HKIT Subject Code'] || ''}</td>
                                <td class="col-b">${row['HKIT Subject Name'] || ''}</td>
                                <td class="col-c text-center">${exemptionStatus}</td>
                                <td class="col-d">${previousStudies}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="approval-section">
                <div style="margin-bottom: 10px;">
                    <strong>Total Units of Advanced Standing Approved:</strong> _______________
                </div>
                
                <div style="margin-bottom: 10px;">
                    <strong>Intake Level Approved:</strong> _______________
                </div>
                
                <div class="note">*delete as appropriate</div>
            </div>
            
            <div class="signature-section">
                <div style="margin-bottom: 15px;">
                    Signature: <span class="signature-line"></span>
                </div>
            </div>
            
            <div class="programme-leader">
                Programme Leader (Higher Diploma of Science and Technology)
            </div>
            
            <div class="no-print" style="margin-top: 30px; text-align: center; padding: 20px; border-top: 2px solid #ddd;">
                <h3 style="margin-bottom: 15px; color: #333;">PDF生成選項</h3>
                <button onclick="window.print()" style="padding: 12px 24px; font-size: 14px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">🖨️ 打印/保存為PDF</button>
                <button onclick="window.close()" style="padding: 12px 24px; font-size: 14px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">❌ 關閉窗口</button>
                <div style="margin-top: 15px; font-size: 12px; color: #666; line-height: 1.4;">
                    💡 <strong>提示:</strong> 點擊「打印/保存為PDF」後，在打印對話框中選擇「另存為PDF」<br>
                    📋 此格式完全符合學校要求，可直接提交使用
                </div>
            </div>
        </body>
        </html>
        `;
    },

    /**
     * 獲取當前數據
     */
    getCurrentData() {
        // 優先從 EditModeController 獲取
        if (typeof EditModeController !== 'undefined' && EditModeController.getCurrentData) {
            return EditModeController.getCurrentData();
        }
        
        // 其次從 ResultsDisplay 獲取
        if (typeof ResultsDisplay !== 'undefined' && ResultsDisplay.currentResults) {
            return ResultsDisplay.currentResults;
        }
        
        return null;
    },

    /**
     * 獲取學生資訊
     */
    getStudentInfo() {
        if (typeof StudentInfoManager !== 'undefined' && StudentInfoManager.getStudentInfo) {
            return StudentInfoManager.getStudentInfo();
        }
        return { name: '', applicationNumber: '', appliedProgramme: '' };
    },

    /**
     * 生成檔案名稱
     */
    generateFilename(extension, prefix = 'course-exemption-analysis') {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const studentInfo = this.getStudentInfo();
        const studentName = studentInfo.name ? `-${studentInfo.name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '')}` : '';
        return `${prefix}${studentName}-${timestamp}.${extension}`;
    },

    /**
     * 下載檔案
     */
    downloadFile(content, mimeType, filename) {
        const blob = new Blob([content], { type: mimeType + ';charset=utf-8;' });
        this.downloadBlob(blob, filename);
    },

    /**
     * 下載 Blob
     */
    downloadBlob(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    /**
     * 顯示匯出按鈕
     */
    showExportButtons() {
        const csvBtn = document.getElementById('downloadBtn');
        const excelBtn = document.getElementById('downloadExcelBtn');
        const pdfBtn = document.getElementById('downloadPdfBtn');
        
        if (csvBtn) {
            csvBtn.style.display = 'inline-block';
            csvBtn.classList.remove('hidden');
        }
        if (excelBtn) {
            excelBtn.style.display = 'inline-block';
            excelBtn.classList.remove('hidden');
        }
        if (pdfBtn) {
            pdfBtn.style.display = 'inline-block';
            pdfBtn.classList.remove('hidden');
        }
        
        console.log('✅ 專業匯出按鈕已顯示');
    },

    /**
     * 隱藏匯出按鈕
     */
    hideExportButtons() {
        const csvBtn = document.getElementById('downloadBtn');
        const excelBtn = document.getElementById('downloadExcelBtn');
        const pdfBtn = document.getElementById('downloadPdfBtn');
        
        if (csvBtn) {
            csvBtn.style.display = 'none';
            csvBtn.classList.add('hidden');
        }
        if (excelBtn) {
            excelBtn.style.display = 'none';
            excelBtn.classList.add('hidden');
        }
        if (pdfBtn) {
            pdfBtn.style.display = 'none';
            pdfBtn.classList.add('hidden');
        }
        
        console.log('🙈 專業匯出按鈕已隱藏');
    }
};

// 全域函數（供 HTML onclick 使用）
window.downloadIntegratedResults = () => AdvancedExporter.downloadIntegratedResults();
window.downloadExcelApplication = () => AdvancedExporter.downloadExcelApplication();
window.generatePdfApplication = () => AdvancedExporter.generatePdfApplication();

// 測試函數（供編程測試使用）
window.testShowExportButtons = () => {
    console.log('🔧 手動觸發顯示匯出按鈕...');
    AdvancedExporter.showExportButtons();
};

window.testHideExportButtons = () => {
    console.log('🔧 手動觸發隱藏匯出按鈕...');
    AdvancedExporter.hideExportButtons();
};