import html2pdf from 'html2pdf.js';

export const generatePDF = async (elementId: string, filename: string = 'document.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return;
  }

  // Create a clone to manipulate styles for PDF without affecting UI
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Create a wrapper to hold the clone temporarily
  const wrapper = document.createElement('div');
  wrapper.appendChild(clone);
  
  // Basic PDF styling adjustments
  clone.style.padding = '40px';
  clone.style.width = '800px';
  clone.style.maxWidth = '800px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#0f172a'; // slate-900
  
  // Ensure we don't display it on screen
  wrapper.style.position = 'absolute';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '-9999px';
  document.body.appendChild(wrapper);

  const opt = {
    margin:       10,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(opt).from(clone).save();
  } catch (error) {
    console.error("Error generating PDF", error);
  } finally {
    document.body.removeChild(wrapper);
  }
};
