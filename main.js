(function () {
  const storageKey = 'subnote.subscriptions.v1';
  const form = document.getElementById('subscription-form');
  const nameInput = document.getElementById('name');
  const amountInput = document.getElementById('amount');
  const cycleInput = document.getElementById('cycle');
  const dateInput = document.getElementById('nextPaymentDate');
  const categoryInput = document.getElementById('category');
  const paymentMethodInput = document.getElementById('paymentMethod');
  const notice = document.getElementById('notice');
  const submitLabel = document.getElementById('submit-label');
  const cancelEditButton = document.getElementById('cancel-edit');
  let subscriptions = [];
  let editingId = null;

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = false;
  }

  function clearNotice() {
    notice.textContent = '';
    notice.hidden = true;
  }

  function loadSubscriptions() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) throw new Error('저장된 데이터가 목록 형식이 아닙니다.');
      return parsed;
    } catch (error) {
      showNotice('저장된 구독 정보를 읽지 못했습니다. 브라우저 저장 공간을 확인해 주세요.');
      console.error('구독 정보를 불러오지 못했습니다.', error);
      return [];
    }
  }

  function persist(nextSubscriptions) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextSubscriptions));
      subscriptions = nextSubscriptions;
      clearNotice();
      render();
      return true;
    } catch (error) {
      showNotice('구독 정보를 저장하지 못했습니다. 브라우저의 저장 공간 설정을 확인해 주세요.');
      console.error('구독 정보를 저장하지 못했습니다.', error);
      return false;
    }
  }

  function render() {
    SubscriptionUI.render(subscriptions, beginEdit, deleteSubscription);
  }

  function resetForm() {
    form.reset();
    editingId = null;
    submitLabel.textContent = '구독 추가';
    cancelEditButton.hidden = true;
    document.getElementById('form-title').textContent = '구독 추가하기';
  }

  function beginEdit(id) {
    const subscription = subscriptions.find(function (item) { return item.id === id; });
    if (!subscription) {
      showNotice('수정할 구독을 찾을 수 없습니다.');
      return;
    }
    editingId = id;
    nameInput.value = subscription.name;
    amountInput.value = String(subscription.amount);
    cycleInput.value = subscription.cycle;
    dateInput.value = subscription.nextPaymentDate;
    categoryInput.value = subscription.category;
    paymentMethodInput.value = subscription.paymentMethod || '';
    submitLabel.textContent = '수정 저장';
    cancelEditButton.hidden = false;
    document.getElementById('form-title').textContent = '구독 수정하기';
    clearNotice();
    nameInput.focus();
  }

  function deleteSubscription(id) {
    const subscription = subscriptions.find(function (item) { return item.id === id; });
    if (!subscription) return;
    if (!window.confirm(subscription.name + ' 구독을 삭제할까요?')) return;
    const nextSubscriptions = subscriptions.filter(function (item) { return item.id !== id; });
    if (persist(nextSubscriptions) && editingId === id) resetForm();
  }

  function createId() {
    return 'sub_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearNotice();

    const amount = Number(amountInput.value);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      showNotice('금액은 1원 이상의 정수로 입력해 주세요.');
      amountInput.focus();
      return;
    }

    const existing = subscriptions.find(function (item) { return item.id === editingId; });
    const subscription = {
      id: editingId || createId(),
      name: nameInput.value.trim(),
      amount: amount,
      cycle: cycleInput.value,
      nextPaymentDate: dateInput.value,
      category: categoryInput.value.trim(),
      paymentMethod: paymentMethodInput.value.trim()
    };

    if (!subscription.name || !subscription.category || !subscription.nextPaymentDate) {
      showNotice('서비스 이름, 다음 결제일, 카테고리를 입력해 주세요.');
      return;
    }

    const nextSubscriptions = existing
      ? subscriptions.map(function (item) { return item.id === editingId ? subscription : item; })
      : subscriptions.concat(subscription);

    if (persist(nextSubscriptions)) resetForm();
  });

  cancelEditButton.addEventListener('click', function () {
    resetForm();
    clearNotice();
  });

  subscriptions = loadSubscriptions();
  render();
}());
