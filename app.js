const URLAPI = 'https://script.google.com/macros/s/AKfycbwVXp6_F_VthBjLh0BW22W4Dvw_lfl90lWTQKjt6ltkqxPvlfUjW8QBru-nTLjF97Se/exec';
//const URLAPI = 'https://script.google.com/macros/s/AKfycbxGXnRt_9VFqY9K8-j3Jdx7uMOfbYxAg6ug5mt7Uim5i_wuDUg4I1J0iLpblKB9xp0zIQ/exec';
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

    loadingSpinner.style.display = 'block'; 

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

    books = data.data.sheet1Data
    ? data.data.sheet1Data.filter((book) => book && book.Visibility !== '0')
    : [];
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
  
  // Create colorRGB object for color mappings
  const colorRGB = fieldState.colorblock
    ? fieldState.colorblock
        .split(';')
        .map(colorItem => colorItem.split(':'))
        .reduce((acc, [colorName, rgb]) => ({ ...acc, [colorName.trim()]: rgb.trim().slice(1, -1) }), {})
    : {};
  
  // Helper function to render specific tag rows
  function renderTagRow(tagKey, selectedBook, fieldState) {
    const selectedTag = selectedBook?.[tagKey] ?? ''; 
    const fieldTag = fieldState?.[tagKey] ?? ''; 
    let sectionField = null;
    let sectionValue = selectedTag;

    if (typeof fieldTag === 'string' && fieldTag.includes(';')) {
      try {
        const tagPairs = fieldTag.split(';').map(pair => pair.split('~').map(s => s.trim()));
        const matchingPair = tagPairs.find(([sectionName]) => sectionName === selectedBook?.section);

        if (matchingPair) {
          sectionField = matchingPair[1]; 
        }
      } catch (error) {
        console.error(`Error parsing tag ${tagKey}: ${error}`);
      }
    }

    if (sectionField) {
      return `<p><b>${sectionField}:</b> ${sectionValue}</p>`;
    }
    return `<p><b>${fieldTag || `Tag ${tagKey.slice(-1)}`}:</b> ${selectedTag}</p>`;
  }

  return tagFields
    .filter(tagKey => book[tagKey]) // Only if the book has data for the tag
    .map(tagKey => {
      if (['tags5', 'tags6', 'tags7', 'tags8'].includes(tagKey)) {
        return renderTagRow(tagKey, book, fieldState);
      }

      let label = fieldState[tagKey] || (tagKey === 'size' ? 'Size' : tagKey === 'color' ? 'Color' : `Tag ${tagKey.slice(-1)}`);
      
      if (tagKey === 'color' && colorRGB[book[tagKey]?.trim()]) {
        return `<p><b>${label}:</b> ${book[tagKey]} 
          <span class='circle' style='background-color: rgb(${colorRGB[book[tagKey]?.trim()]})'></span>
        </p>`;
      }

      return `<p><b>${label}:</b> ${book[tagKey]}</p>`;
    })
    .join('');
}


// Helper function to capitalize any word (used for general tags if needed)
function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// Catalog
document.addEventListener('DOMContentLoaded', () => {
  const catalogButton = document.getElementById('catalog-button');
  const catalogModal = document.getElementById('catalog-modal');
  const closeCatalogModal = document.getElementById('close-catalog-modal');
  const sectionList = document.getElementById('section-list');
  const currentFilter = document.getElementById('current-filter');

  let selectedSection = null;
  let selectedPartition = null;
  
  catalogButton.addEventListener('click', () => {
    renderSections();
    highlightActiveSelection();
    catalogModal.style.display = 'block';
  });
  
  closeCatalogModal.addEventListener('click', () => {
    catalogModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === catalogModal) {
      catalogModal.style.display = 'none';
    }
  });

  function updateCurrentFilterDisplay() {
    currentFilter.innerHTML = '';

    const showAllLink = document.createElement('a');
    showAllLink.textContent = 'Show all';
    showAllLink.addEventListener('click', resetFilters);
    currentFilter.appendChild(showAllLink);

    if (!selectedSection && !selectedPartition) {
      currentFilter.style.display = 'block'; 
      return;
    }

    if (selectedSection) {
      const sectionLink = document.createElement('a');
      sectionLink.textContent = selectedSection;
      sectionLink.addEventListener('click', () => filterBooksBySection(selectedSection));
      currentFilter.appendChild(document.createTextNode(' > '));
      currentFilter.appendChild(sectionLink);
    }

    if (selectedPartition) {
      const partitionLink = document.createElement('a');
      partitionLink.textContent = selectedPartition;
      partitionLink.addEventListener('click', () => filterBooks(selectedSection, selectedPartition));
      currentFilter.appendChild(document.createTextNode(' > '));
      currentFilter.appendChild(partitionLink);
    }

    currentFilter.style.display = 'block'; 
  }

  function resetFilters() {
    selectedSection = null;
    selectedPartition = null;
    displayBooks(books, fieldState);
    catalogModal.style.display = 'none';
    updateCurrentFilterDisplay();
  }

  function renderSections() {
    sectionList.innerHTML = '';   
    const showAllItem = document.createElement('li');
    showAllItem.textContent = ' Show all';
    showAllItem.classList.add('section-item');
    if (!selectedSection && !selectedPartition) {
      showAllItem.classList.add('active'); 
    }
    showAllItem.addEventListener('click', resetFilters);
    sectionList.appendChild(showAllItem);

    const uniqueSections = [...new Set(books.map(book => book.section))];

    uniqueSections.forEach(section => {
      const li = document.createElement('li');
      li.innerHTML = `<div class="section-toggle">${section} ${
        hasPartitions(section) ? '<span class="toggle">+</span>' : ''
      }</div>`;
      li.classList.add('section-item');

      const toggle = li.querySelector('.toggle');
      if (toggle) {
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          togglePartitions(li, section);
        });
      }

      li.addEventListener('click', () => {
        selectedSection = section;
        selectedPartition = null;
        filterBooksBySection(section);
      });

      sectionList.appendChild(li);
    });
  }

  function hasPartitions(section) {
    return books.some(book => book.section === section && book.partition);
  }

  function togglePartitions(liElement, section) {
    const toggle = liElement.querySelector('.toggle');
    const existingContainer = liElement.querySelector('.partition-container');

    if (!toggle) return;

    if (existingContainer) {
      existingContainer.remove();
      toggle.textContent = '+';
    } else {
      const partitionContainer = document.createElement('ul');
      partitionContainer.classList.add('partition-container');

      const partitions = [...new Set(
        books.filter(book => book.section === section).map(book => book.partition)
      )];

      partitions.forEach(partition => {
        const partitionLi = document.createElement('li');
        partitionLi.textContent = partition || 'Without subsection';
        partitionLi.classList.add('partition-item');

        if (section === selectedSection && partition === selectedPartition) {
          partitionLi.classList.add('active'); 
        }

        partitionLi.addEventListener('click', (e) => {
          e.stopPropagation();
          selectedSection = section;
          selectedPartition = partition || 'Without subsection';
          filterBooks(section, partition);
        });

        partitionContainer.appendChild(partitionLi);
      });

      liElement.appendChild(partitionContainer);
      toggle.textContent = '-';
    }
  }

  function highlightActiveSelection() {
    const sectionItems = document.querySelectorAll('.section-item');
    const partitionItems = document.querySelectorAll('.partition-item');

    sectionItems.forEach(item => item.classList.remove('active'));
    partitionItems.forEach(item => item.classList.remove('active'));

    if (!selectedSection && !selectedPartition) {
      const showAllItem = sectionList.querySelector('.section-item:first-child');
      if (showAllItem) showAllItem.classList.add('active');
    }

    if (selectedSection && !selectedPartition) {
      sectionItems.forEach(item => {
        if (item.textContent.trim().includes(selectedSection)) {
          item.classList.add('active');
        }
      });
    }

    if (selectedPartition) {
      partitionItems.forEach(item => {
        if (item.textContent.trim() === selectedPartition) {
          item.classList.add('active');
        }
      });
      expandSectionIfPartitionSelected(); // Expand section if subsection is selected
    }
  }

  function expandSectionIfPartitionSelected() {
    const sectionItems = document.querySelectorAll('.section-item');

    sectionItems.forEach(item => {
      const sectionName = item.textContent.trim().split(' ')[0]; // Get section name
      if (sectionName === selectedSection) {
        const toggle = item.querySelector('.toggle');

        if (toggle && toggle.textContent === '+') {
          toggle.click(); // Expand section
        }
      }
    });
  }

  function filterBooksBySection(section) {
    selectedSection = section;
    selectedPartition = null;
    const filteredBooks = books.filter(book => book.section === section);
    displayBooks(filteredBooks, fieldState);
    catalogModal.style.display = 'none';
    updateCurrentFilterDisplay();
  }

  function filterBooks(section, partition) {
    selectedSection = section;
    selectedPartition = partition;
    const filteredBooks = books.filter(book => {
      return book.section === section && (partition === 'Without subsection' ? !book.partition : book.partition === partition);
    });
    displayBooks(filteredBooks, fieldState);
    catalogModal.style.display = 'none';
    updateCurrentFilterDisplay();
    expandSectionIfPartitionSelected(); //Expand section
  }
});



function displayBooks(books, fieldState) {
  bookList.innerHTML = ''; // Clear previous book cards

  books.forEach(book => {
    const bookElement = document.createElement('div');
    bookElement.classList.add('shelf-element');
    bookElement.setAttribute('data-sorted', book.sorted || ''); // Set data-sorted attribute
    bookElement.setAttribute('data-id', book.id);
    let bookPrice = book.price ? `${book.price} ${fieldState.payment || '$'}` : 'Price not specified';
    if (book.saleprice && book.saleprice.trim() !== '') {
      bookPrice = `       
        <span class="sale-price">${book.price} ${fieldState.payment || '$'}</span>
        <span class="original-price">${book.saleprice} ${fieldState.payment || '$'}</span>
      `;
    }

    // Image processing    
  let firstImage = 
  (book.imagepublic && typeof book.imagepublic === 'string' && book.imagepublic.trim() !== '')
    ? `img/publik/${book.imagepublic.trim()}`
  : (book.imageblockpublic && typeof book.imageblockpublic === 'string' && book.imageblockpublic.trim() !== '')
    ? `img/publik/${book.imageblockpublic.split(',').map(img => img.trim()).find(img => img !== '') || ''}`
  : (book.image && typeof book.image === 'string' && book.image.trim() !== '')
    ? book.image.trim()
  : (book.imageblock && typeof book.imageblock === 'string' && book.imageblock.trim() !== '')
    ? book.imageblock.split(',').map(img => img.trim()).find(img => img !== '') || ''
  : 'img/imageNotFound.png';

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

    // Badge icon handling
    let badgeIcon = '';
    if (book.sorted === 'new') {
      badgeIcon = `<img src="img/new.png" class="art-icon" alt="New Cart">`;
    } else if (book.sorted === 'sale') {
      badgeIcon = `<img src="img/discont.png" class="art-icon" alt="Discount Cart">`;
    } else if (book.sorted === 'popular') {
      badgeIcon = `<img src="img/popular.png" class="art-icon" alt="Popular Cart">`;
    }

    // HTML for each book card
    bookElement.innerHTML = `
     <div class="id-rating"> ${bookId}  ${ratingDisplay}</div>
      <div class="img-container"> 
        ${badgeIcon}     
       <img src="${firstImage}" alt="${book.title}" loading="lazy" onerror="this.onerror=null;this.src='img/imageNotFound.png';">
        
        ${sizeColorDisplay ? `<div class="book-size-color">${sizeColorDisplay}</div>` : ''}          
      </div>    
      <div class="book-name">${book.title}</div>
      <div class="book-price">${bookPrice}</div>     
      <button class="show-more-btn" onclick="showMoreInfo(${book.id})">Learn more</button>  
    `;

    bookList.appendChild(bookElement);
  });
}

// Helper function for rendering only size and color tags
function renderSizeColorTags(book, fieldState) {
  const tagFields = ['size', 'color'];
  const colorRGB = fieldState.colorblock
    ? fieldState.colorblock
        .split(';')
        .map(colorItem => colorItem.split(':'))
        .reduce((acc, [colorName, rgb]) => ({ ...acc, [colorName.trim()]: rgb.trim().slice(1, -1) }), {})
    : {};

  return tagFields
    .filter(tagKey => book[tagKey]) // Только если данные для размера или цвета существуют
    .map(tagKey => {
      if (tagKey === 'color' && book[tagKey] && colorRGB[book[tagKey].trim()]) {
        return `<p><b>${fieldState[tagKey] || capitalize(tagKey)}</b> ${book[tagKey]} 
          <span class='circle' style='background-color: rgb(${colorRGB[book[tagKey].trim()]})'></span>
        </p>`;
      }
      return `<p><b>${fieldState[tagKey] || capitalize(tagKey)}</b> ${book[tagKey]}</p>`;
    })
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



function searchBooks() {
  const searchQuery = document.getElementById('search-input').value.toLowerCase();
  const books = Array.from(bookList.children); 
  let resultsFound = false;  // Variable to track if any books match the search

  books.forEach(bookElement => {
    const bookTitle = bookElement.querySelector('.book-name').textContent.toLowerCase();
    const bookId = bookElement.getAttribute('data-id'); // Use data-id attribute for ID
    
    if (bookTitle.includes(searchQuery) || (bookId && bookId.includes(searchQuery))) {
      bookElement.style.display = 'block'; 
      resultsFound = true; // If there's a match, set resultsFound to true
    } else {
      bookElement.style.display = 'none'; 
    }
  });

  // Show the "Oops, nothing found" message if no books match the search
  const noResultsMessage = document.getElementById('no-results-message');
  if (!resultsFound) {
    noResultsMessage.style.display = 'block';
  } else {
    noResultsMessage.style.display = 'none';
  }
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

  // Hide the "Oops" message when the search is cleared
  const noResultsMessage = document.getElementById('no-results-message');
  noResultsMessage.style.display = 'none';
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
  if (bookAuthorElem) bookAuthorElem.textContent = `Author: ${book.author || 'Unknown'}`;
  //if (bookPriceElem) bookPriceElem.textContent = `Price: ${book.price ? `${book.price} ${fieldState.payment}` : 'Price not specified'}`;
  if (bookPriceElem) { if (book.saleprice && book.saleprice.trim() !== '')
     { bookPriceElem.innerHTML = `
      <span class="sale-price">${book.price} ${fieldState.payment || '$'}</span>
      <span class="original-price">${book.saleprice} ${fieldState.payment || '$'}</span> `; }
  else { bookPriceElem.textContent = `Price: ${book.price ? `${book.price} ${fieldState.payment}` : 'Price not specified'}`; } }
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
  
const images = 
(book.imageblockpublic && typeof book.imageblockpublic === 'string' && book.imageblockpublic.trim() !== '')
    ? book.imageblockpublic.split(',')
        .map(img => img.trim())
        .filter(img => img !== '')
        .map(img => `img/publik/${img}`)
: (book.imageblock && typeof book.imageblock === 'string' && book.imageblock.trim() !== '')
    ? book.imageblock.split(',')
        .map(img => img.trim())
        .filter(img => img !== '')
: [];

    images.forEach((image, index) => {
      const img = document.createElement('img');     
      img.src = image.trim();
      img.alt = `Book Image ${index + 1}`;
      img.classList.add('image-option');
      //Checking image loading
      img.onerror = function() {
        this.onerror = null;
        this.src = 'img/imageNotFound.png';
      };
      img.onclick = () => changeImage(image.trim());
      imageGallery.appendChild(img);
    });
  
    // Set the first image if available
    if (bookModalImg && images.length > 0) {
      bookModalImg.src = images[0].trim();
      bookModalImg.onerror = function() {
        this.onerror = null;
        this.src = 'img/imageNotFound.png';
      };
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
      const closeButton = document.createElement('div');
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
