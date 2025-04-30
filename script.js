document.addEventListener('DOMContentLoaded', function() {
  // Set default quote number with date
  const today = new Date();
  const dateString = today.getFullYear().toString().substr(-2) + 
                    (today.getMonth() + 1).toString().padStart(2, '0') + 
                    today.getDate().toString().padStart(2, '0');
  document.getElementById('quoteNumber').value = "Q-MJK-" + dateString + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  
  // Configure toastr with improved opacity
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: 3000,
    toastClass: 'toast',
    containerId: 'toast-container',
    newestOnTop: true,
    preventDuplicates: false,
    onclick: null,
    showDuration: 300,
    hideDuration: 1000,
    extendedTimeOut: 1000,
    showEasing: 'swing',
    hideEasing: 'linear',
    showMethod: 'fadeIn',
    hideMethod: 'fadeOut',
    tapToDismiss: true,
    debug: false
  };

  // Initialize date picker with today's date
  flatpickr(".flatpickr", {
    dateFormat: "d-m-Y",
    defaultDate: today
  });

  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', function() {
    let modal = new bootstrap.Modal(document.getElementById('settingsModal'));
    // Update settings fields with current values
    document.getElementById('setCompanyName').value = document.getElementById('companyName').value;
    document.getElementById('setCompanyAddress').value = document.getElementById('companyAddress').value;
    document.getElementById('setCompanyCity').value = document.getElementById('companyCity').value;
    document.getElementById('setCompanyEmail').value = document.getElementById('companyEmail').value;
    document.getElementById('setCompanyContact').value = document.getElementById('companyContact').value;
    document.getElementById('setPaymentNote').value = document.getElementById('paymentNote').value;
    document.getElementById('setSignatureText').value = document.getElementById('signatureText').textContent;
    document.getElementById('setQuotePrefix').value = document.getElementById('quoteNumber').value.split('-').slice(0, 2).join('-') + '-';
    modal.show();
  });

  // Save settings
  document.getElementById('saveSettings').addEventListener('click', function() {
    document.getElementById('companyName').value = document.getElementById('setCompanyName').value;
    document.getElementById('companyAddress').value = document.getElementById('setCompanyAddress').value;
    document.getElementById('companyCity').value = document.getElementById('setCompanyCity').value;
    document.getElementById('companyEmail').value = document.getElementById('setCompanyEmail').value;
    document.getElementById('companyContact').value = document.getElementById('setCompanyContact').value;
    document.getElementById('paymentNote').value = document.getElementById('setPaymentNote').value;
    document.getElementById('signatureText').textContent = document.getElementById('setSignatureText').value;
    document.getElementById('quotePrefix').value = document.getElementById('setQuotePrefix').value;
    
    // Update quote number prefix if changed
    const currentNumber = document.getElementById('quoteNumber').value.split('-').slice(2).join('-');
    document.getElementById('quoteNumber').value = document.getElementById('setQuotePrefix').value + currentNumber;
    
    bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
    toastr.success('Settings saved successfully');
  });

  // Add row to table
  document.querySelector('.add-row').addEventListener('click', function() {
    const tbody = document.querySelector('#itemsTable tbody');
    const rowCount = tbody.children.length + 1;
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
      <td class="text-center">${rowCount}</td>
      <td><input type="text" class="form-control item-input" data-field="particulars"></td>
      <td><input type="number" class="form-control item-input calc-trigger" data-field="quantity" min="0" step="1"></td>
      <td><input type="number" class="form-control item-input calc-trigger" data-field="width" step="0.01" min="0"></td>
      <td><input type="number" class="form-control item-input calc-trigger" data-field="length" step="0.01" min="0"></td>
      <td><input type="number" class="form-control item-input editable-calc" data-field="sqft" min="0" step="0.01"></td>
      <td><input type="number" class="form-control item-input editable-calc" data-field="tsqft" min="0" step="0.01"></td>
      <td><input type="number" class="form-control item-input calc-trigger" data-field="rate" step="0.01" min="0"></td>
      <td><input type="number" class="form-control item-input editable-calc" data-field="amount" min="0" step="0.01"></td>
      <td class="text-center no-print"><i class="fas fa-times-circle delete-row"></i></td>
    `;
    
    tbody.appendChild(newRow);
    setupDeleteRowHandlers();
    setupCalculationHandlers();
  });

  // Setup delete row handlers
  function setupDeleteRowHandlers() {
    document.querySelectorAll('.delete-row').forEach(button => {
      button.removeEventListener('click', handleDeleteRow);
      button.addEventListener('click', handleDeleteRow);
    });
  }

  // Handle delete row
  function handleDeleteRow() {
    const row = this.closest('tr');
    if (document.querySelectorAll('#itemsTable tbody tr').length > 1) {
      row.remove();
      // Update row numbers
      document.querySelectorAll('#itemsTable tbody tr').forEach((row, index) => {
        row.querySelector('td:first-child').textContent = index + 1;
      });
      calculateTotals();
    } else {
      toastr.warning('Cannot delete the last row');
    }
  }

  // Setup calculation handlers
  function setupCalculationHandlers() {
    document.querySelectorAll('.calc-trigger').forEach(input => {
      input.removeEventListener('input', handleCalculation);
      input.addEventListener('input', handleCalculation);
    });

    document.querySelectorAll('.editable-calc').forEach(input => {
      input.removeEventListener('input', calculateTotals);
      input.addEventListener('input', calculateTotals);
    });
  }

  // Handle calculation for a row - with improved inches to feet conversion
  function handleCalculation() {
    const row = this.closest('tr');
    const quantityInput = row.querySelector('[data-field="quantity"]');
    const widthInput = row.querySelector('[data-field="width"]');
    const lengthInput = row.querySelector('[data-field="length"]');
    const sqftInput = row.querySelector('[data-field="sqft"]');
    const tsqftInput = row.querySelector('[data-field="tsqft"]');
    const rateInput = row.querySelector('[data-field="rate"]');
    const amountInput = row.querySelector('[data-field="amount"]');
    
    // Get values, defaulting to 0 if not present
    const quantity = parseFloat(quantityInput.value) || 0;
    const widthInches = parseFloat(widthInput.value) || 0;
    const lengthInches = parseFloat(lengthInput.value) || 0;
    const rate = parseFloat(rateInput.value) || 0;
    
    // Convert inches to feet
    const widthFeet = widthInches / 12;
    const lengthFeet = lengthInches / 12;
    
    // Calculate SQFT (width × length in feet)
    let sqft = widthFeet * lengthFeet;
    sqftInput.value = sqft.toFixed(2);
    
    // Calculate TSQFT (SQFT × quantity)
    let tsqft = sqft * quantity;
    tsqftInput.value = tsqft.toFixed(2);
    
    // Calculate amount (TSQFT × rate)
    let amount = tsqft * rate;
    amountInput.value = amount.toFixed(2);
    
    calculateTotals();
  }

  // Calculate totals
  function calculateTotals() {
    // Calculate subtotal
    let subtotal = 0;
    document.querySelectorAll('#itemsTable tbody tr').forEach(row => {
      const amountInput = row.querySelector('[data-field="amount"]');
      subtotal += parseFloat(amountInput.value || 0);
    });
    
    // Update subtotal field
    document.getElementById('subTotal').value = subtotal.toFixed(2);
    
    // Calculate tax
    const taxRate = parseFloat(document.getElementById('taxRate').value || 0);
    const taxAmount = subtotal * (taxRate / 100);
    document.getElementById('taxAmount').value = taxAmount.toFixed(2);
    
    // Calculate grand total
    const transportCharges = parseFloat(document.getElementById('transportCharges').value || 0);
    const grandTotal = subtotal + taxAmount + transportCharges;
    document.getElementById('grandTotal').value = grandTotal.toFixed(2);
  }

  // Recalculate when tax rate changes
  document.getElementById('taxRate').addEventListener('input', calculateTotals);
  
  // Recalculate when transport charges change
  document.getElementById('transportCharges').addEventListener('input', calculateTotals);

  // Download PDF with improved template
  document.getElementById('downloadPDF').addEventListener('click', function() {
    // Check if customer name is filled
    if (!document.getElementById('customerName').value.trim()) {
      toastr.error('Please enter customer name');
      return;
    }
    
    // Show a loading message
    toastr.info('Generating PDF, please wait...');
    
    // Populate the PDF template with data
    populatePdfTemplate();
    
    // Wait for the next tick to ensure the PDF template is fully updated
    setTimeout(function() {
      // Generate PDF
      generatePdf();
    }, 100);
  });

  // Function to populate the PDF template with form data
  function populatePdfTemplate() {
    // Company Information
// Replace or update this line in the populatePdfTemplate function
    document.getElementById('pdf-company-name').textContent = document.getElementById('companyName').value;
    document.getElementById('pdf-company-address').textContent = document.getElementById('companyAddress').value;
    document.getElementById('pdf-company-city').textContent = document.getElementById('companyCity').value;
    document.getElementById('pdf-company-contact').textContent = document.getElementById('companyContact').value;
    document.getElementById('pdf-company-email').textContent = document.getElementById('companyEmail').value;
    
    // Document Information
    document.getElementById('pdf-document-type').textContent = document.getElementById('quotationType').value;
    document.getElementById('pdf-quote-number').textContent = document.getElementById('quoteNumber').value;
    document.getElementById('pdf-date').textContent = document.getElementById('date').value;
    
    // Customer Information
    document.getElementById('pdf-customer-name').textContent = document.getElementById('customerName').value;
    document.getElementById('pdf-customer-address').textContent = document.getElementById('customerAddress').value || 'N/A';
    document.getElementById('pdf-customer-phone').textContent = document.getElementById('customerPhone').value || 'N/A';
    document.getElementById('pdf-customer-email').textContent = document.getElementById('customerEmail').value || 'N/A';
    document.getElementById('pdf-project-reference').textContent = document.getElementById('projectReference').value || 'N/A';
    
    // Items Table
    const itemsBody = document.getElementById('pdf-items-body');
    itemsBody.innerHTML = '';
    
    document.querySelectorAll('#itemsTable tbody tr').forEach((row, index) => {
      const particulars = row.querySelector('[data-field="particulars"]').value || '';
      const quantity = row.querySelector('[data-field="quantity"]').value || '';
      const widthInches = parseFloat(row.querySelector('[data-field="width"]').value) || 0;
      const lengthInches = parseFloat(row.querySelector('[data-field="length"]').value) || 0;
      const sqft = row.querySelector('[data-field="sqft"]').value || '';
      const tsqft = row.querySelector('[data-field="tsqft"]').value || '';
      const rate = row.querySelector('[data-field="rate"]').value || '';
      const amount = row.querySelector('[data-field="amount"]').value || '';
      
      // Convert inches to feet+inches display
      const widthFeet = Math.floor(widthInches / 12);
      const widthRemainder = (widthInches % 12).toFixed(2);
      const lengthFeet = Math.floor(lengthInches / 12);
      const lengthRemainder = (lengthInches % 12).toFixed(2);
      
      const widthDisplay = widthInches > 0 ? `${widthInches}" (${widthFeet}' ${widthRemainder}")` : '';
      const lengthDisplay = lengthInches > 0 ? `${lengthInches}" (${lengthFeet}' ${lengthRemainder}")` : '';
      
      if (particulars || quantity || widthInches || lengthInches || rate || amount) {
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
          <td>${index + 1}</td>
          <td style="text-align: left;">${particulars}</td>
          <td>${quantity}</td>
          <td>${widthDisplay}</td>
          <td>${lengthDisplay}</td>
          <td>${sqft}</td>
          <td>${tsqft}</td>
          <td>${rate}</td>
          <td class="text-right">₹ ${formatNumber(amount)}</td>
        `;
        itemsBody.appendChild(newRow);
      }
    });
    
    // If no items were added, add a placeholder row
    if (itemsBody.children.length === 0) {
      const placeholderRow = document.createElement('tr');
      placeholderRow.innerHTML = `
        <td colspan="9" style="text-align: center;">No items added</td>
      `;
      itemsBody.appendChild(placeholderRow);
    }
    
    // Notes and Totals
    document.getElementById('pdf-notes').textContent = document.getElementById('notesTextarea').value || '';
    document.getElementById('pdf-subtotal').textContent = '₹ ' + formatNumber(document.getElementById('subTotal').value);
    document.getElementById('pdf-tax-rate').textContent = document.getElementById('taxRate').value;
    document.getElementById('pdf-tax-amount').textContent = '₹ ' + formatNumber(document.getElementById('taxAmount').value);
    document.getElementById('pdf-transport').textContent = '₹ ' + formatNumber(document.getElementById('transportCharges').value);
    document.getElementById('pdf-grand-total').textContent = '₹ ' + formatNumber(document.getElementById('grandTotal').value);
    
    // Payment Terms and Signature
    document.getElementById('pdf-payment-terms').textContent = document.getElementById('paymentNote').value;
    document.getElementById('pdf-signature-text').textContent = document.getElementById('signatureText').textContent;
    
    // Show watermark if checked
    const watermarkElement = document.getElementById('pdf-watermark');
    if (document.getElementById('showWatermark').checked) {
      watermarkElement.style.display = 'block';
    } else {
      watermarkElement.style.display = 'none';
    }
  }

  // Function to generate and download the PDF
  function generatePdf() {
    const pdfContent = document.getElementById('pdfContent');
    
    // Temporarily make the content visible but off-screen for PDF generation
    pdfContent.style.display = 'block';
    
    // Use html2canvas and jsPDF to generate the PDF
    html2canvas(pdfContent, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      logging: false
    }).then(canvas => {
      // Hide the content again
      pdfContent.style.display = 'none';
      
      // Set up the PDF document
      const pdf = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions
      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / pageWidth;
      const imgHeight = canvasHeight / ratio;
      
      // Add the image to the PDF
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add more pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Add company name and details to the PDF document properties
      pdf.setProperties({
        title: document.getElementById('companyName').value + ' - Quotation',
        subject: 'Quotation for ' + document.getElementById('customerName').value,
        author: document.getElementById('companyName').value,
        creator: document.getElementById('companyName').value
      });
      
      // Get filename from customer name and quote number
      const customerName = document.getElementById('customerName').value.trim()
        .replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const quoteNumber = document.getElementById('quoteNumber').value.trim()
        .replace(/[^a-z0-9-]/gi, '_');
      const fileName = `Quotation_${quoteNumber}_${customerName}.pdf`;
      
      // Save the PDF
      pdf.save(fileName);
      
      // Show success message
      toastr.success('PDF downloaded successfully');
    }).catch(error => {
      console.error('Error generating PDF:', error);
      toastr.error('Error generating PDF. Please try again.');
    });
  }

  // Download Excel
  document.getElementById('downloadExcel').addEventListener('click', function() {
    // Check if customer name is filled
    if (!document.getElementById('customerName').value.trim()) {
      toastr.error('Please enter customer name');
      return;
    }
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    wb.Props = {
      Title: "Quotation",
      Subject: "Quotation",
      Author: document.getElementById('companyName').value,
      CreatedDate: new Date()
    };
    
    // Add company info worksheet
    const companyWS = XLSX.utils.aoa_to_sheet([
      ["Company Information"],
      ["Company Name", "MJ KRAFTECH & STONE DESIGN"],
      ["Address", document.getElementById('companyAddress').value],
      ["", document.getElementById('companyCity').value],
      ["Email", document.getElementById('companyEmail').value],
      ["Contact", document.getElementById('companyContact').value],
      [""],
      ["Quotation Details"],
      ["Date", document.getElementById('date').value],
      ["Quote Number", document.getElementById('quoteNumber').value],
      [""],
      ["Customer Information"],
      ["Name", document.getElementById('customerName').value],
      ["Address", document.getElementById('customerAddress').value],
      ["Phone", document.getElementById('customerPhone').value],
      ["Email", document.getElementById('customerEmail').value],
      ["Project Reference", document.getElementById('projectReference').value]
    ]);
    
    // Add items worksheet
    const headers = ["Sr", "Particulars", "Quantity", "Width", "Length", "SQ.FT", "T.SQFT", "Rate", "Amount"];
    const itemsData = [headers];
    
    document.querySelectorAll('#itemsTable tbody tr').forEach(row => {
      const rowData = [];
      rowData.push(row.querySelector('td:first-child').textContent);
      
      row.querySelectorAll('.item-input').forEach(input => {
        rowData.push(input.value || "");
      });
      
      itemsData.push(rowData);
    });
    
    // Add total rows
    itemsData.push([]);
    itemsData.push(["", "", "", "", "", "", "", "Sub Total", document.getElementById('subTotal').value]);
    itemsData.push(["", "", "", "", "", "", "", "GST (" + document.getElementById('taxRate').value + "%)", document.getElementById('taxAmount').value]);
    itemsData.push(["", "", "", "", "", "", "", "Transport", document.getElementById('transportCharges').value]);
    itemsData.push(["", "", "", "", "", "", "", "TOTAL", document.getElementById('grandTotal').value]);
    itemsData.push([]);
    itemsData.push(["Payment Terms", document.getElementById('paymentNote').value]);
    itemsData.push(["Note", "Loading/unloading charges applicable as per distance"]);
    
    const itemsWS = XLSX.utils.aoa_to_sheet(itemsData);
    
    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(wb, companyWS, "Company Info");
    XLSX.utils.book_append_sheet(wb, itemsWS, "Items");
    
    // Get customer name for filename
    const customerName = document.getElementById('customerName').value.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const quoteNumber = document.getElementById('quoteNumber').value.trim().replace(/[^a-z0-9-]/gi, '_');
    const fileName = `Quotation_${quoteNumber}_${customerName}.xlsx`;
    
    // Save Excel file
    XLSX.writeFile(wb, fileName);
    toastr.success('Excel file downloaded successfully');
  });

  // Reset form
  document.getElementById('resetForm').addEventListener('click', function() {
    if (confirm('Are you sure you want to reset the form? All data will be lost.')) {
      // Clear all form fields except company details
      document.getElementById('customerName').value = '';
      document.getElementById('customerAddress').value = '';
      document.getElementById('customerPhone').value = '';
      document.getElementById('customerEmail').value = '';
      document.getElementById('projectReference').value = '';
      
      // Reset table to one empty row
      const tbody = document.querySelector('#itemsTable tbody');
      tbody.innerHTML = `
        <tr>
          <td class="text-center">1</td>
          <td><input type="text" class="form-control item-input" data-field="particulars"></td>
          <td><input type="number" class="form-control item-input calc-trigger" data-field="quantity" min="0" step="1"></td>
          <td><input type="number" class="form-control item-input calc-trigger" data-field="width" step="0.01" min="0"></td>
          <td><input type="number" class="form-control item-input calc-trigger" data-field="length" step="0.01" min="0"></td>
          <td><input type="number" class="form-control item-input editable-calc" data-field="sqft" min="0" step="0.01"></td>
          <td><input type="number" class="form-control item-input editable-calc" data-field="tsqft" min="0" step="0.01"></td>
          <td><input type="number" class="form-control item-input calc-trigger" data-field="rate" step="0.01" min="0"></td>
          <td><input type="number" class="form-control item-input editable-calc" data-field="amount" min="0" step="0.01"></td>
          <td class="text-center no-print"><i class="fas fa-times-circle delete-row"></i></td>
        </tr>
      `;
      
      // Reset totals
      document.getElementById('subTotal').value = '0.00';
      document.getElementById('taxAmount').value = '0.00';
      document.getElementById('transportCharges').value = '0';
      document.getElementById('grandTotal').value = '0.00';
      
      // Generate new quote number
      const today = new Date();
      const dateString = today.getFullYear().toString().substr(-2) + 
                        (today.getMonth() + 1).toString().padStart(2, '0') + 
                        today.getDate().toString().padStart(2, '0');
      document.getElementById('quoteNumber').value = "Q-MJK-" + dateString + "-" + Math.floor(Math.random() * 100).toString().padStart(2, '0');
      
      // Reset date to today
      flatpickr("#date", {
        dateFormat: "d-m-Y",
        defaultDate: today
      });
      
      // Reattach event handlers
      setupDeleteRowHandlers();
      setupCalculationHandlers();
      
      toastr.info('Form has been reset');
    }
  });

  // Preview functionality
  document.getElementById('previewBtn').addEventListener('click', function() {
    // Check if customer name is filled
    if (!document.getElementById('customerName').value.trim()) {
      toastr.error('Please enter customer name');
      return;
    }
    
    // Clone the document for preview
    const content = document.querySelector('.card').cloneNode(true);
    
    // Remove no-print elements
    content.querySelectorAll('.no-print').forEach(el => el.remove());
    
    // Add watermark if checked
    if (document.getElementById('showWatermark').checked) {
      const watermark = document.createElement('div');
      watermark.classList.add('watermark');
      watermark.textContent = 'QUOTATION';
      content.appendChild(watermark);
    }
    
    // Update preview content
    document.getElementById('previewContent').innerHTML = '';
    document.getElementById('previewContent').appendChild(content);
    
    // Show preview modal
    let modal = new bootstrap.Modal(document.getElementById('previewModal'));
    modal.show();
  });

  // Print preview
  document.getElementById('printPreview').addEventListener('click', function() {
    window.print();
  });

  // Initialize event handlers
  setupDeleteRowHandlers();
  setupCalculationHandlers();

  // Make total fields recalculate on manual edit
  document.getElementById('subTotal').addEventListener('change', function() {
    calculateTotals();
  });

  document.getElementById('taxAmount').addEventListener('change', function() {
    calculateTotals();
  });

  document.getElementById('grandTotal').addEventListener('change', function() {
    // Do nothing, grand total is the final calculation
  });

  // Update loading/unloading note with shorter text
  document.getElementById('quotePrefix').value = "Loading/unloading charges applicable as per distance";

  // Helper function to format numbers with comma separators
  function formatNumber(value) {
    if (!value) return '0.00';
    
    const num = parseFloat(value);
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // Initial calculation
  calculateTotals();
});