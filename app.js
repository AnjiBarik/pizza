const URLAPI = 'https://script.google.com/macros/s/AKfycbwVXp6_F_VthBjLh0BW22W4Dvw_lfl90lWTQKjt6ltkqxPvlfUjW8QBru-nTLjF97Se/exec';
let books = []; // Global variable
let fieldState = {};
let aggregatedData = [];

const bookList = document.getElementById('book-list');
const loadingSpinner = document.getElementById('loading-spinner');
const themeToggle = document.getElementById('theme-toggle');

document.addEventListener('DOMContentLoaded', () => {
  const seeMoreButton = document.getElementById('see-more-btn');
  const mainHeader = document.getElementById('main-header');
  const headerContent = document.querySelector('.header-content');
  const floatingButton = document.createElement('button');
  floatingButton.classList.add('floating-button');
  floatingButton.textContent = 'GET FIRST DIBS!';
  document.body.appendChild(floatingButton);

  const filtersSection = document.querySelector('.filters');
  const loadingSpinner = document.getElementById('loading-spinner');
  const scrollToTopButton = document.getElementById('scroll-to-top-btn'); 
  
  loadingSpinner.style.display = 'none';

  //Click handler for the "See More" button
  seeMoreButton.addEventListener('click', (e) => {
    e.preventDefault();

    loadingSpinner.style.display = 'block'; // Показываем спиннер

    // Start loading data
    fetchBooks()
      .then(() => {
        mainHeader.style.display = 'none';
        headerContent.classList.add('hidden');
        floatingButton.classList.add('show');
        filtersSection.style.display = 'flex';
      })
      .catch((error) => {
        console.error("Error loading data:", error);
      })
      .finally(() => {
        loadingSpinner.style.display = 'none'; 
      });
  });

  // Click handler for floating button
  floatingButton.addEventListener('click', () => {
    window.location.href = 'https://anjibarik.github.io/do/#/BookList/3'; 
  });

  // Smooth scrolling up
  scrollToTopButton.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });

  // Function to update scrolling progress
  function updateScrollProgress() {
    const scrollTop = window.scrollY; // Current scroll position
    const docHeight = document.documentElement.scrollHeight - window.innerHeight; // Full Page Height
    const scrollPercent = (scrollTop / docHeight) * 100; // Scroll percentage

    // Update the background gradient for progress
    const progress = scrollToTopButton.querySelector('.scroll-progress');
    if (progress) {
      // Set progress color depending on scrolling
      progress.style.background = `conic-gradient(#4caf50 ${scrollPercent}%, #ddd ${scrollPercent}% 100%)`;
    }

    // Show/hide the button depending on scrolling
    if (scrollTop > 100) {
      scrollToTopButton.style.display = 'flex';
    } else {
      scrollToTopButton.style.display = 'none';
    }
  } 

  // Scroll event handler
  window.addEventListener('scroll', updateScrollProgress);

  // Initialization at start
  updateScrollProgress();
});

const setTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme); 
  try {
      localStorage.setItem('theme', theme);
  } catch (error) {
      console.error("Error writing theme to localStorage:", error.message);
  }
  
  const sunIcon = themeToggle.querySelector('.icon-sun');
  const moonIcon = themeToggle.querySelector('.icon-moon');
  if (theme === 'dark') {
      sunIcon.style.transform = 'rotate(-180deg) scale(0)';
      moonIcon.style.transform = 'rotate(0deg) scale(1)';
  } else {
      sunIcon.style.transform = 'rotate(0deg) scale(1)';
      moonIcon.style.transform = 'rotate(180deg) scale(0)';
  }
};

themeToggle?.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  setTheme(currentTheme === 'light' ? 'dark' : 'light');
});    

// Safe functions for reading and writing to localStorage
const initTheme = () => {
  let savedTheme;        
 
  try {
      savedTheme = localStorage.getItem('theme');
  } catch (error) {
      console.error("Error reading theme from localStorage:", error.message);
      savedTheme = null; 
  }

  const urlTheme = new URLSearchParams(window.location.search).get('theme');
  const browserTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';        
  
  setTheme(urlTheme || savedTheme || browserTheme || 'light');
};    

initTheme();


// Function to show spinner when loading
function showLoadingSpinner() {
  loadingSpinner.style.display = 'block';
}

// Function to hide the spinner after loading
function hideLoadingSpinner() {
  loadingSpinner.style.display = 'none';
}

// Function for getting data from API
async function fetchBooks() {
  try {
    showLoadingSpinner();
    const formData = new FormData();
    formData.append('isReviews', 10);

    const response = await fetch(URLAPI, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!data.success) throw new Error(data.message || 'Error fetching combined data');

    books = data.data.sheet1Data;
    fieldState = data.data.sheet2Data?.[0] || {};
    //console.log(books)
    //console.log(fieldState)

    if (fieldState.idprice) {
      const formDataReviews = new FormData();
      formDataReviews.append('isReviews', 1);
      formDataReviews.append('idPrice', fieldState.idprice);

      const responseReviews = await fetch(URLAPI, {
        method: 'POST',
        body: formDataReviews,
      });

      const dataReviews = await responseReviews.json();

      if (!dataReviews.success) throw new Error(dataReviews.message || 'Failed to fetch review data');
      //console.log(dataReviews)
      aggregatedData = dataReviews.data || [];
      //console.log('Aggregated Data (Reviews):', aggregatedData);
     
    }

    document.querySelector('.filters').style.display = 'flex';

    displayBooks(books, fieldState);
  } catch (error) {
    console.error('Error fetching books:', error);
  } finally {
    hideLoadingSpinner();
  }
}

// Helper function for rendering tags with default labels for size and color
function renderTags(book, fieldState) {
  const tagFields = ['size', 'color', 'tags1', 'tags2', 'tags3', 'tags4', 'tags5', 'tags6', 'tags7', 'tags8'];

  return tagFields
    .filter(tagKey => book[tagKey]) // Only if the book has data for the tag
    .map(tagKey => {
      // Set default labels for size and color if fieldState does not have them
      const label = tagKey === 'size' 
        ? (fieldState[tagKey] || 'Size') 
        : tagKey === 'color' 
        ? (fieldState[tagKey] || 'Color') 
        : (fieldState[tagKey] || `Tag ${tagKey.slice(-1)}`);
      
      return `<p><b>${label}:</b> ${book[tagKey]}</p>`;
    })
    .join('');
}

// Helper function to capitalize any word (used for general tags if needed)
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}


function displayBooks(books, fieldState) {
  bookList.innerHTML = ''; // Clear previous book cards

  books.forEach(book => {
    const bookElement = document.createElement('div');
    bookElement.classList.add('shelf-element');
    bookElement.setAttribute('data-sorted', book.sorted || ''); // Set data-sorted attribute
    bookElement.setAttribute('data-id', book.id);
    const bookPrice = book.price ? `${book.price} ${fieldState.payment || '$'}` : 'Цена не указана';

    // Image processing
    const images = book.imageblock ? book.imageblock.split(',') : [];
    let firstImage = book.image ? book.image : (images.length > 0 && images[0].trim() !== '' ? images[0].trim() : 'imageNotFound.png');
    const bookId = book.id ? `<div class="book-id">ID: ${book.id}</div>` : '';

    // Rating Data Processing
    const productRating = aggregatedData.find(
      (item) => `${item.ID_Price}` === `${fieldState.idprice}` && `${item.ID_Product}` === `${book.id}`
    );

    // Render star rating
    const renderStars = (averageRating) => {
      const fullStars = Math.floor(averageRating);
      const halfStar = averageRating % 1 >= 0.5 ? 1 : 0;
      const emptyStars = 5 - fullStars - halfStar;

      return `
        <span class="rating-stars">
          ${Array(fullStars).fill().map(() => '<span class="star filled">★</span>').join('')}
          ${halfStar ? '<span class="star half-filled">★</span>' : ''}
          ${Array(emptyStars).fill().map(() => '<span class="star">★</span>').join('')}
        </span>
      `;
    };    

    const ratingDisplay = productRating
      ? `  
        <div class="rating-stars">     
          ${renderStars(productRating.Average_Rating)}
          <span class="review-count">${productRating.Review_Count} </span>
        </div>        
      `
      : ''; // Empty if no rating data is found

    // Render only size and color tags
    const sizeColorDisplay = renderSizeColorTags(book, fieldState);

    // HTML for each book card
    bookElement.innerHTML = `
     <div class="id-rating"> ${bookId}  ${ratingDisplay}</div>
      <div class="img-container">
        <img src="${firstImage}" alt="${book.title}" loading="lazy">
      </div>    
      <div class="book-name">${book.title}</div>
      <div class="book-price">${bookPrice}</div>
      <div class="book-size-color">${sizeColorDisplay}</div> <!-- Size and color display added here -->
      <button class="show-more-btn" onclick="showMoreInfo(${book.id})">Product Details</button>  
    `;

    bookList.appendChild(bookElement);
  });
}

// Helper function for rendering only size and color tags
function renderSizeColorTags(book, fieldState) {
  const tagFields = ['size', 'color'];
  return tagFields
    .filter(tagKey => book[tagKey]) // Only if the book has data for size or color
    .map(tagKey => `<p><b>${fieldState[tagKey] || capitalize(tagKey)}:</b> ${book[tagKey]}</p>`)
    .join('');
}

// Function for sorting books by type
function sortBy(type) {
  const books = Array.from(bookList.children);
  
  const sortedBooks = books.sort((a, b) => {
    const aType = a.getAttribute('data-sorted'); 
    const bType = b.getAttribute('data-sorted');
    
    if (aType === type && bType !== type) return -1;
    if (aType !== type && bType === type) return 1;
    return 0;
  });

  // Update the DOM to display sorted books
  bookList.innerHTML = '';
  sortedBooks.forEach(book => bookList.appendChild(book));
}


// Function to sort by price
function sortByPrice(direction) {
  const books = Array.from(bookList.children);
  const sortedBooks = books.sort((a, b) => {
    // We extract prices from .book-price elements and reduce them to numbers
    const priceA = extractPrice(a.querySelector('.book-price').textContent);
    const priceB = extractPrice(b.querySelector('.book-price').textContent);

    // Sort in ascending or descending order depending on direction
    if (direction === 'low') {
      return priceA - priceB;
    } else if (direction === 'high') {
      return priceB - priceA;
    }
    return 0;
  });

  //Clearing the list and adding sorted books
  bookList.innerHTML = '';
  sortedBooks.forEach(book => bookList.appendChild(book));
}

// Helper function to extract a numeric value from a price string
function extractPrice(priceText) {
  // Remove all non-numeric characters (except the dot for decimals)
  const price = parseFloat(priceText.replace(/[^\d.-]/g, ''));
  
  // Return the price (if the price is not numeric, return 0)
  return isNaN(price) ? 0 : price;
}



// debounce function
function debounce(func, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

// Search function
function searchBooks() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const books = Array.from(bookList.children); 

  books.forEach(bookElement => {
    const bookTitle = bookElement.querySelector('.book-name').textContent.toLowerCase();
    const bookId = bookElement.getAttribute('data-id'); // Use data-id attribute for ID
    
    if (bookTitle.includes(searchQuery) || (bookId && bookId.includes(searchQuery))) {
      bookElement.style.display = 'block'; 
    } else {
      bookElement.style.display = 'none'; 
    }
  });
}

// Event handler for search field with debounce
document.getElementById('search-input').addEventListener('input', debounce(searchBooks, 300));

// Function to reset search and display all books
function clearSearch() {
 
  document.getElementById('search-input').value = '';  
 
  const books = Array.from(bookList.children);
  books.forEach(bookElement => {
    bookElement.style.display = 'block';
  });
}



document.addEventListener('DOMContentLoaded', () => { 

  // Closing a modal window
  const closeModalButton = document.getElementById('close-modal');
  if (closeModalButton) {
    closeModalButton.onclick = function() {
      document.getElementById('modal').style.display = 'none';
    };
  }

  // Closing a modal window when clicking outside of it
  window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };


// Main function to display book details in a modal
window.showMoreInfo = function(bookId) {
  const book = books.find(b => b.id == bookId);     
  if (!book) {
    console.error('Book not found for ID:', bookId);
    return;
  }

  // Update modal content elements
  const bookTitleElem = document.getElementById('book-title');
  const bookDescriptionElem = document.getElementById('book-description');
  const bookAuthorElem = document.getElementById('book-author');
  const bookPriceElem = document.getElementById('book-price');
  const bookTagsElem = document.getElementById('book-tags');
  const imageGallery = document.getElementById('image-gallery');
  const bookModalImg = document.getElementById('book-modal-img');
  const modalElem = document.getElementById('modal');
  const bookID = document.getElementById('book-ID');
  const bookRatingElem = document.getElementById('book-rating'); // Element for the rating display

  if (bookID) bookID.textContent = `ID: ${bookId}`;
  if (bookTitleElem) bookTitleElem.textContent = book.title;
  if (bookDescriptionElem) bookDescriptionElem.textContent = book.description || 'No description';
  if (bookAuthorElem) bookAuthorElem.textContent = `Автор: ${book.author || 'Unknown'}`;
  if (bookPriceElem) bookPriceElem.textContent = `Цена: ${book.price ? `${book.price} ${fieldState.payment}` : 'Price not specified'}`;
  if (bookTagsElem) bookTagsElem.innerHTML = renderTags(book, fieldState);

  // Rating Data Processing
  const productRating = aggregatedData.find(
    (item) => `${item.ID_Price}` === `${fieldState.idprice}` && `${item.ID_Product}` === `${book.id}`
  );

  // Render star rating
  const renderStars = (averageRating) => {
    const fullStars = Math.floor(averageRating);
    const halfStar = averageRating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    return `
      <span class="rating-stars">
        ${Array(fullStars).fill().map(() => '<span class="star filled">★</span>').join('')}
        ${halfStar ? '<span class="star half-filled">★</span>' : ''}
        ${Array(emptyStars).fill().map(() => '<span class="star">★</span>').join('')}
      </span>
    `;
  };

  // Display Rating and Review Count if rating data is available
  if (bookRatingElem) {
    bookRatingElem.innerHTML = productRating
      ? `
        ${renderStars(productRating.Average_Rating)}
        <span class="review-count">${productRating.Review_Count} </span>
      `
      : ''; // Display a message if no rating data is found
  }

  // Clear and populate the image gallery
  if (imageGallery) {
    imageGallery.innerHTML = '';

    const images = book.imageblock ? book.imageblock.split(',') : [];
    images.forEach((image, index) => {
      const img = document.createElement('img');
      img.src = image.trim();
      img.alt = `Book Image ${index + 1}`;
      img.classList.add('image-option');
      img.onclick = () => changeImage(image.trim());
      imageGallery.appendChild(img);
    });

    // Set the first image if available
    if (bookModalImg && images.length > 0) {
      bookModalImg.src = images[0].trim();
    }
  }

  // Show the modal if it exists
  if (modalElem) {
    modalElem.style.display = 'block';
  }
};

// Function to change the image in the modal
function changeImage(imageUrl) {
  const bookModalImg = document.getElementById('book-modal-img');
  if (bookModalImg) {
    bookModalImg.src = imageUrl;
  }
}

// Function to display an image in fullscreen mode
const fullscreenBtn = document.getElementById('fullscreen-btn');
if (fullscreenBtn) {
  fullscreenBtn.onclick = function() {
    const img = document.getElementById('book-modal-img');
    if (img) {
      const fullscreenContainer = document.createElement('div');
      fullscreenContainer.id = 'fullscreen-container';
      fullscreenContainer.classList.add('fullscreen-overlay');

      // Copy the image into the new container
      const fullscreenImage = img.cloneNode();
      fullscreenImage.classList.add('fullscreen-image');
      
      // Add a close button for exiting fullscreen mode
      const closeButton = document.createElement('button');
      closeButton.id = 'close-fullscreen-btn';
      closeButton.classList.add('close-fullscreen');
      closeButton.innerHTML = '&times;';
      closeButton.onclick = function() {
        document.body.removeChild(fullscreenContainer); // Remove the fullscreen container
      };

      // Add the image and close button to the container
      fullscreenContainer.appendChild(fullscreenImage);
      fullscreenContainer.appendChild(closeButton);

      // Add the container to the page
      document.body.appendChild(fullscreenContainer);
    }
  };
}

});

// Contact form
const contactForm = document.getElementById('contactForm');
const formResponse = document.getElementById('formResponse');
const emailField = document.getElementById('email');
const messageField = document.getElementById('message');
const submitBtn = document.getElementById('submitBtn'); // Form Validation
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;    

const validateForm = () => {
    const isEmailValid = emailPattern.test(emailField.value.trim());
    const isMessageValid = messageField.value.trim() !== '';
    submitBtn.disabled = !(isEmailValid && isMessageValid);
};

emailField.addEventListener('input', validateForm);
messageField.addEventListener('input', validateForm);

// Safe function to read from localStorage
function safeReadStorage(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        console.error("Error reading from localStorage:", error.message);
        return [];
    }
}

// Safe function to write to localStorage
function safeWriteStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error("Error writing to localStorage:", error.message);
    }
}

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    formResponse.textContent = '';

    // Spam Protection
    const now = Date.now();
    const oneMinute = 60 * 1000;
    let submissions = safeReadStorage('submissions');

    // Remove entries older than one minute
    const recentSubmissions = submissions.filter(timestamp => now - timestamp < oneMinute);
    
    if (recentSubmissions.length >= 5) {
        formResponse.textContent = 'You have reached the maximum of 5 submissions per minute. Please try again later.';
        formResponse.style.color = 'red';
        submitBtn.disabled = false;
        return;
    }

    if (recentSubmissions.length && now - recentSubmissions[recentSubmissions.length - 1] < oneMinute) {
        formResponse.textContent = 'Please wait at least a minute before submitting again.';
        formResponse.style.color = 'red';
        submitBtn.disabled = false;
        return;
    }

    recentSubmissions.push(now);
    safeWriteStorage('submissions', recentSubmissions);

    // Change button text to "Sending..."
    submitBtn.textContent = 'Sending...';

    const formData = new FormData(contactForm);
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbxUbPt7dwfbK928m-KRled0s4km18cJCgZHV9Nohf7MnvCoxxrSvMXqs1zblzi1wWfq/exec', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            formResponse.textContent = 'Message sent successfully!';
            formResponse.style.color = 'green';
            contactForm.reset();
        } else {
            formResponse.textContent = 'Error sending message. Please try again later.';
            formResponse.style.color = 'red';
        }
    } catch (error) {
        console.error('Error sending form:', error.message);
        formResponse.textContent = 'Error connecting to the server. Please try again.';
        formResponse.style.color = 'red';
    } finally {
        submitBtn.textContent = 'Send Message';
        submitBtn.disabled = false;
    }
});

// Toggle contact form visibility
document.querySelector('.contact-toggle').addEventListener('click', function() {
    var contactFormSection = document.querySelector('.contact-form-section');
    if (contactFormSection.style.display === 'none' || contactFormSection.style.display === '') {
        contactFormSection.style.display = 'block';
        this.textContent = '- Hide Contact Form';
    } else {
        contactFormSection.style.display = 'none';
        this.textContent = '+ Show Contact Form';
    }
});