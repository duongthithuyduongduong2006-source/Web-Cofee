document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo giỏ hàng từ LocalStorage
    let cart = [];
    try {
        const savedCart = localStorage.getItem('coffeeHouseCart');
        cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
        console.error("Lỗi đọc giỏ hàng:", e);
        cart = [];
    }

    // Các phần tử giao diện chính
    const elements = {
        cartBadge: document.getElementById('cartBadge'),
        cartCountSidebar: document.getElementById('cartCountSidebar'),
        cartBody: document.getElementById('cartBody'),
        cartPageShipping: document.getElementById('cartPageShipping'),
        cartSubtotal: document.getElementById('cartSubtotal'),
        cartSidebar: document.getElementById('cartSidebar'),
        cartOverlay: document.getElementById('cartOverlay'),
        // Thêm các phần tử trang giỏ hàng mới
        cartPageItems: document.getElementById('cartPageItems'),
        cartPageSubtotal: document.getElementById('cartPageSubtotal'),
        cartPageTotal: document.getElementById('cartPageTotal'),
        cartPageDiscount: document.getElementById('cartPageDiscount'),
        pageCheckoutBtn: document.getElementById('pageCheckoutBtn'),
        cartToggle: document.getElementById('cartToggle'), 
        closeCart: document.getElementById('closeCart'),
        checkoutBtn: document.getElementById('checkoutBtn'),
        searchBtn: document.getElementById('searchBtn'),
        searchWrapper: document.querySelector('.search-wrapper'),
        searchInput: document.getElementById('searchInput'),
        navOrderBtn: document.getElementById('navOrderBtn'),
        heroOrderBtn: document.getElementById('heroOrderBtn')
    };

    // Tạo Toast container nếu chưa có (để hiển thị thông báo)
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.setAttribute('style', 'z-index: 1100');
    document.body.appendChild(toastContainer);

    // Cập nhật giao diện lần đầu khi tải trang
    updateCartUI();

    // Hàm đóng/mở Giỏ hàng
    function toggleCart() {
        if (!elements.cartSidebar) return;
        elements.cartSidebar.classList.toggle('active');
        if (elements.cartOverlay) {
            elements.cartOverlay.style.display = elements.cartSidebar.classList.contains('active') ? 'block' : 'none';
        }
    }

    // Gán sự kiện đóng/mở
    [elements.closeCart, elements.cartOverlay].forEach(el => {
        el?.addEventListener('click', toggleCart);
    });

    // Ấn vô icon giỏ hàng ở header sẽ chuyển hướng sang trang cart.html
    elements.cartToggle?.addEventListener('click', () => {
        window.location.href = 'cart.html';
    });

    // Cuộn xuống Menu khi nhấn các nút "Đặt ngay" chính
    const orderButtons = [elements.navOrderBtn, elements.heroOrderBtn];
    orderButtons.forEach(btn => {
        btn?.addEventListener('click', () => {
            // Chuyển hướng thẳng đến trang thanh toán theo yêu cầu
            window.location.href = 'cart.html';
        });
    });

    // Xử lý lưu dữ liệu sản phẩm để xem chi tiết
    document.addEventListener('click', (e) => {
        const productLink = e.target.closest('.product-link');
        if (productLink) {
            const card = productLink.closest('.seller-card') || productLink.closest('.side-item') || productLink.closest('.featured-item-large');
            const dataBtn = card?.querySelector('[data-product]');
            if (dataBtn) {
                localStorage.setItem('selectedProduct', dataBtn.getAttribute('data-product'));
            }
        }
    });

    // Hiển thị dữ liệu trên trang product-detail.html
    if (window.location.pathname.includes('product-detail.html')) {
        const productStr = localStorage.getItem('selectedProduct');
        if (productStr) {
            const product = JSON.parse(productStr);
            const basePrice = product.price; // Lưu giá gốc làm mốc tính toán
            
            const detailUI = {
                name: document.getElementById('detailName'),
                price: document.getElementById('detailPrice'),
                img: document.getElementById('detailImg'),
                btn: document.getElementById('detailAddBtn')
            };

            if (detailUI.name) detailUI.name.textContent = product.name;
            if (detailUI.price) detailUI.price.textContent = product.price.toLocaleString('vi-VN') + 'đ';
            if (detailUI.img) {
                detailUI.img.src = product.image;
                detailUI.img.alt = product.name;
            }

            // Gán dữ liệu mặc định (Size S) cho nút thêm vào giỏ
            if (detailUI.btn) {
                const defaultData = { ...product, name: `${product.name} (S)` };
                detailUI.btn.setAttribute('data-product', JSON.stringify(defaultData));
            }

            // Xử lý chọn Option (Size, Đường, Đá)
            document.querySelectorAll('.option-group .btn-pill').forEach(btn => {
                btn.addEventListener('click', function() {
                    const group = this.closest('.option-group');
                    group.querySelectorAll('.btn-pill').forEach(b => b.classList.remove('active'));
                    this.classList.add('active');

                    // Nếu nhấn vào nút trong nhóm Size
                    const label = group.querySelector('label').textContent.toLowerCase();
                    if (label.includes('size')) {
                        const offset = parseInt(this.getAttribute('data-size-offset') || 0);
                        const newPrice = basePrice + offset;
                        const sizeCode = this.textContent.split(' ')[0]; // Lấy "S" hoặc "M"

                        // Cập nhật giá trên giao diện
                        if (detailUI.price) detailUI.price.textContent = newPrice.toLocaleString('vi-VN') + 'đ';

                        // Cập nhật thông tin vào nút Thêm vào giỏ
                        if (detailUI.btn) {
                            const updatedProduct = { 
                                ...product, 
                                price: newPrice, 
                                name: `${product.name} (${sizeCode})` // Phân biệt size trong giỏ hàng
                            };
                            detailUI.btn.setAttribute('data-product', JSON.stringify(updatedProduct));
                        }
                    }
                });
            });
        }
    }

    // Xử lý sự kiện thêm món (Sử dụng Event Delegation để tối ưu)
    document.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-cart') || e.target.closest('.buy-now');
        
        if (addBtn) {
            try {
                const productData = JSON.parse(addBtn.getAttribute('data-product'));
                addToCart(productData);
                
                // Hiệu ứng và thông báo
                elements.cartToggle?.classList.add('cart-bump');
                setTimeout(() => elements.cartToggle?.classList.remove('cart-bump'), 300);
                showToast(`Đã thêm ${productData.name} vào giỏ hàng!`);

                // Mở sidebar tự động khi thêm món
                if (cart.length === 1 && elements.cartSidebar && !elements.cartSidebar.classList.contains('active')) {
                    toggleCart();
                }

                // Nếu nhấn "Đặt ngay", chuyển hướng thẳng đến trang giỏ hàng
                if (addBtn.classList.contains('buy-now')) {
                    window.location.href = 'cart.html';
                }
            } catch (error) {
                console.error("Lỗi dữ liệu sản phẩm:", error);
            }
        }
    });

    function addToCart(product) {
        const existingItem = cart.find(item => item.name === product.name);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        saveCart();
        updateCartUI();
    }

    function saveCart() {
        localStorage.setItem('coffeeHouseCart', JSON.stringify(cart));
    }

    function updateCartUI() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = totalPrice > 0 ? 15000 : 0;
        const discount = 0; // Có thể cập nhật logic mã giảm giá ở đây

        if (elements.cartBadge) elements.cartBadge.textContent = totalItems;
        if (elements.cartCountSidebar) elements.cartCountSidebar.textContent = totalItems;
        if (elements.cartSubtotal) elements.cartSubtotal.textContent = totalPrice.toLocaleString('vi-VN') + 'đ';

        // Hiển thị cho TRANG GIỎ HÀNG (Dạng Card mới)
        if (elements.cartPageItems) {
            if (cart.length === 0) {
                elements.cartPageItems.innerHTML = '<div class="text-center py-5"><p class="text-muted">Giỏ hàng của bạn đang trống.</p></div>';
                if (elements.pageCheckoutBtn) elements.pageCheckoutBtn.disabled = true;
            } else {
                elements.cartPageItems.innerHTML = cart.map((item, index) => `
                    <div class="cart-card d-flex align-items-center p-3 mb-3">
                        <img src="${item.image || 'IMAGES/caphesua1.jpg'}" alt="${item.name}" class="rounded-3 me-3" style="width: 80px; height: 80px; object-fit: cover;">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between">
                                <h6 class="mb-0 fw-bold">${item.name}</h6>
                                <span class="fw-bold">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</span>
                            </div>
                            <p class="text-muted small mb-2">Tùy chọn mặc định</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <div class="quantity-control px-2 py-1">
                                    <button class="btn btn-sm p-0 qty-btn" data-index="${index}" data-action="decrease">-</button>
                                    <span class="mx-3 fw-bold">${item.quantity}</span>
                                    <button class="btn btn-sm p-0 qty-btn" data-index="${index}" data-action="increase">+</button>
                                </div>
                                <i class="fa-regular fa-trash-can text-danger-custom remove-btn" data-index="${index}"></i>
                            </div>
                        </div>
                    </div>
                `).join('');
                if (elements.pageCheckoutBtn) elements.pageCheckoutBtn.disabled = false;
            }

            // Cập nhật bảng tính tiền trang giỏ hàng
            if (elements.cartPageSubtotal) elements.cartPageSubtotal.textContent = totalPrice.toLocaleString('vi-VN') + 'đ';
            if (elements.cartPageShipping) elements.cartPageShipping.textContent = shipping.toLocaleString('vi-VN') + 'đ';
            if (elements.cartPageDiscount) elements.cartPageDiscount.textContent = `- ${discount.toLocaleString('vi-VN')}đ`;
            if (elements.cartPageTotal) {
                elements.cartPageTotal.textContent = (totalPrice + shipping - discount).toLocaleString('vi-VN') + 'đ';
            }
        }

        if (elements.cartBody) {
            if (cart.length === 0) {
                elements.cartBody.innerHTML = '<div class="text-center mt-5"><i class="fa-solid fa-basket-shopping fa-3x mb-3 opacity-25"></i><p class="text-muted">Giỏ hàng đang trống</p></div>';
                if (elements.checkoutBtn) elements.checkoutBtn.style.display = 'none';
            } else {
                elements.cartBody.innerHTML = cart.map((item, index) => `
                    <div class="cart-item d-flex align-items-center mb-3 pb-3 border-bottom">
                        <img src="${item.image || 'IMAGES/caphesua1.jpg'}" class="rounded-circle me-3" style="width: 40px; height: 40px; object-fit: cover;">
                        <div class="flex-grow-1">
                            <h6 class="mb-0 fw-bold">${item.name}</h6>
                            <small class="text-muted">${item.price.toLocaleString('vi-VN')}đ</small>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <button class="btn btn-sm btn-outline-secondary rounded-circle qty-btn" data-index="${index}" data-action="decrease">-</button>
                            <span class="fw-bold" style="min-width: 20px; text-align: center;">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary rounded-circle qty-btn" data-index="${index}" data-action="increase">+</button>
                            <button class="btn btn-sm text-danger ms-2 remove-btn" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `).join('');
                if (elements.checkoutBtn) elements.checkoutBtn.style.display = 'block';
            }
        }
    }

    function showToast(message) {
        const toastEl = document.createElement('div');
        toastEl.className = 'toast align-items-center text-white bg-dark border-0 mb-2';
        toastEl.setAttribute('role', 'alert');
        toastEl.innerHTML = `
            <div class="d-flex">
                <div class="toast-body"><i class="fa-solid fa-check-circle text-success me-2"></i>${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>`;
        toastContainer.appendChild(toastEl);
        
        const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
        bsToast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }

    // Xử lý tăng/giảm số lượng và xóa món (Dùng chung cho cả Sidebar và Trang giỏ hàng)
    elements.cartBody?.addEventListener('click', (e) => {
        const index = e.target.closest('[data-index]')?.dataset.index;
        if (index === undefined) return;

        if (e.target.closest('.qty-btn')) {
            const action = e.target.closest('.qty-btn').dataset.action;
            if (action === 'increase') cart[index].quantity++;
            else if (action === 'decrease' && cart[index].quantity > 1) cart[index].quantity--;
            saveCart();
            updateCartUI();
        } else if (e.target.closest('.remove-btn')) {
            cart.splice(index, 1);
            saveCart();
            updateCartUI();
        }
    });

    // Lắng nghe sự kiện trên trang giỏ hàng mới
    elements.cartPageItems?.addEventListener('click', (e) => {
        const index = e.target.closest('[data-index]')?.dataset.index;
        if (index === undefined) return;

        if (e.target.closest('.qty-btn')) {
            const action = e.target.closest('.qty-btn').dataset.action;
            if (action === 'increase') cart[index].quantity++;
            else if (action === 'decrease' && cart[index].quantity > 1) cart[index].quantity--;
            saveCart();
            updateCartUI();
        } else if (e.target.closest('.remove-btn')) {
            cart.splice(index, 1);
            saveCart();
            updateCartUI();
        }
    });

    // Logic chuyên biệt cho trang checkout.html
    if (window.location.pathname.includes('checkout.html')) {
        const updateCheckoutPage = () => {
            const list = document.getElementById('checkoutItemsList');
            const subtotal = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
            const shipping = parseInt(document.querySelector('.shipping-option.active')?.dataset.fee || 30000);
            
            if (list) {
                list.innerHTML = cart.map(item => `
                    <div class="d-flex align-items-center mb-3">
                        <img src="${item.image || 'IMAGES/caphesua1.jpg'}" class="rounded-circle me-3" style="width: 45px; height: 45px; object-fit: cover;">
                        <div class="flex-grow-1">
                            <div class="fw-bold small">${item.name}</div>
                            <div class="smaller text-muted">Số lượng: ${item.quantity}</div>
                        </div>
                        <div class="fw-bold small">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</div>
                    </div>`).join('');
            }
            
            if (document.getElementById('checkoutSubtotal')) document.getElementById('checkoutSubtotal').textContent = subtotal.toLocaleString('vi-VN') + 'đ';
            if (document.getElementById('checkoutShipping')) document.getElementById('checkoutShipping').textContent = shipping.toLocaleString('vi-VN') + 'đ';
            if (document.getElementById('checkoutTotal')) document.getElementById('checkoutTotal').textContent = (subtotal + shipping).toLocaleString('vi-VN') + 'đ';
        };

        // Gán sự kiện click cho các phương thức vận chuyển để cập nhật giá tiền
        document.querySelectorAll('.shipping-option').forEach(option => {
            option.addEventListener('click', function() {
                // Xóa class active của các option khác cùng nhóm
                this.parentElement.querySelectorAll('.shipping-option').forEach(el => el.classList.remove('active'));
                // Thêm active cho option hiện tại
                this.classList.add('active');
                // Gọi hàm cập nhật lại toàn bộ bảng tính tiền
                updateCheckoutPage();
            });
        });

        // Gán sự kiện click cho các phương thức thanh toán (chỉ để thay đổi giao diện chọn)
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', function() {
                this.closest('.row').querySelectorAll('.payment-method').forEach(el => el.classList.remove('active'));
                this.classList.add('active');
            });
        });

        updateCheckoutPage();

        // Xử lý nút Đặt hàng cuối cùng
        document.getElementById('finalOrderBtn')?.addEventListener('click', () => {
            const name = document.getElementById('orderName').value;
            if (!name) return alert("Vui lòng nhập tên!");
            
            const successModal = new bootstrap.Modal(document.getElementById('successModal'));
            const total = document.getElementById('checkoutTotal').textContent;
            document.getElementById('successOrderInfo').innerHTML = `
                <p><strong>Mã:</strong> #CH${Math.floor(Math.random()*10000)}</p>
                <p><strong>Khách:</strong> ${name}</p>
                <p><strong>Tổng:</strong> ${total}</p>`;
            
            cart = []; saveCart(); updateCartUI();
            successModal.show();
        });
    }

    // Xử lý chuyển hướng đến trang Thanh toán (Checkout) từ Sidebar và Trang giỏ hàng
    [elements.checkoutBtn, elements.pageCheckoutBtn].forEach(btn => {
        btn?.addEventListener('click', () => {
            if (cart.length > 0) {
                window.location.href = 'checkout.html';
            } else {
                showToast("Giỏ hàng của bạn đang trống!");
            }
        });
    });

    // Nút tiếp tục mua sắm
    document.getElementById('continueShoppingBtn')?.addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('successModal')).hide();
    });

    // Xử lý thanh tìm kiếm
    if (elements.searchBtn && elements.searchWrapper) {
        elements.searchBtn.addEventListener('click', () => {
            elements.searchWrapper.classList.toggle('active');
            if (elements.searchWrapper.classList.contains('active')) {
                elements.searchInput?.focus();
            }
        });
    }
});