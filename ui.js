(function () {
  const formatter = new Intl.NumberFormat('ko-KR');
  const categoryColors = ['#8174e8', '#55b7a0', '#efa65f', '#e47e91', '#6ca8d9', '#a58acb'];
  const iconColors = [
    ['#7164df', '#efedff'],
    ['#399a84', '#e9f7f3'],
    ['#d0874e', '#fff2e7'],
    ['#c3667b', '#fff0f3'],
    ['#548bb9', '#edf6fc'],
    ['#8a70ad', '#f3eff8']
  ];

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function formatWon(amount) {
    return formatter.format(amount) + '원';
  }

  function renderSummary(subscriptions) {
    const monthlyTotal = getTotalMonthlyAmount(subscriptions);
    const yearlyTotal = getTotalYearlyAmount(subscriptions);
    const upcoming = getUpcomingPayments(subscriptions, 7);

    document.getElementById('monthly-total').textContent = formatWon(monthlyTotal);
    document.getElementById('yearly-total').textContent = formatWon(yearlyTotal);
    document.getElementById('upcoming-count').textContent = upcoming.length + '건';
    document.getElementById('upcoming-note').textContent = upcoming.length
      ? '앞으로 7일 이내 결제'
      : '이번 주 결제 예정이 없어요';
    document.getElementById('subscription-count').textContent = subscriptions.length;
  }

  function renderSubscriptions(subscriptions, onEdit, onDelete) {
    const list = document.getElementById('subscription-list');
    const emptyState = document.getElementById('empty-state');
    list.replaceChildren();
    emptyState.hidden = subscriptions.length > 0;

    subscriptions.forEach(function (subscription, index) {
      const palette = iconColors[index % iconColors.length];
      const daysUntil = getDaysUntilNextPayment(
        new Date().toISOString().slice(0, 10),
        subscription.nextPaymentDate
      );
      const item = makeElement('article', 'subscription-item');
      const info = makeElement('div', 'subscription-info');
      const icon = makeElement('span', 'service-icon', subscription.name.slice(0, 1));
      icon.setAttribute('aria-hidden', 'true');
      icon.style.setProperty('--icon-color', palette[0]);
      icon.style.setProperty('--icon-bg', palette[1]);

      const details = makeElement('div', 'service-details');
      details.append(
        makeElement('p', 'service-name', subscription.name),
        makeElement(
          'p',
          'service-meta',
          subscription.category + (subscription.paymentMethod ? ' · ' + subscription.paymentMethod : '')
        )
      );
      info.append(icon, details);

      const side = makeElement('div', 'subscription-side');
      const priceBlock = makeElement('div', 'price-block');
      priceBlock.append(
        makeElement('span', 'service-price', formatWon(subscription.amount)),
        makeElement('span', 'service-cycle', subscription.cycle === 'yearly' ? '매년 결제' : '매월 결제')
      );
      const dueLabel = daysUntil < 0
        ? '결제일 지남'
        : daysUntil === 0
          ? '오늘 결제'
          : 'D-' + daysUntil;
      const due = makeElement('span', 'due-badge' + (daysUntil >= 0 && daysUntil <= 7 ? ' due-soon' : ''), dueLabel);
      priceBlock.append(due);

      const actions = makeElement('div', 'item-actions');
      const editButton = makeElement('button', 'icon-button', '수정');
      editButton.type = 'button';
      editButton.setAttribute('aria-label', subscription.name + ' 수정');
      editButton.addEventListener('click', function () { onEdit(subscription.id); });
      const deleteButton = makeElement('button', 'icon-button delete-button', '삭제');
      deleteButton.type = 'button';
      deleteButton.setAttribute('aria-label', subscription.name + ' 삭제');
      deleteButton.addEventListener('click', function () { onDelete(subscription.id); });
      actions.append(editButton, deleteButton);
      side.append(priceBlock, actions);
      item.append(info, side);
      list.append(item);
    });
  }

  function renderCategories(subscriptions) {
    const container = document.getElementById('category-breakdown');
    const emptyState = document.getElementById('category-empty');
    container.replaceChildren();

    const totals = getMonthlyAmountByCategory(subscriptions);
    const categories = Object.entries(totals).sort(function (a, b) { return b[1] - a[1]; });
    const total = getTotalMonthlyAmount(subscriptions);
    emptyState.hidden = categories.length > 0;

    categories.forEach(function (entry, index) {
      const color = categoryColors[index % categoryColors.length];
      const percentage = total ? Math.round(entry[1] / total * 100) : 0;
      const row = makeElement('div', 'category-item');
      const labelRow = makeElement('div', 'category-label-row');
      const name = makeElement('span', 'category-name');
      const dot = makeElement('span', 'category-dot');
      dot.setAttribute('aria-hidden', 'true');
      dot.style.setProperty('--category-color', color);
      name.append(dot, document.createTextNode(entry[0]));
      labelRow.append(name, makeElement('span', 'category-amount', formatWon(entry[1]) + ' · ' + percentage + '%'));

      const track = makeElement('div', 'category-track');
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-label', entry[0] + ' 비중');
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(percentage));
      const fill = makeElement('div', 'category-fill');
      fill.style.width = percentage + '%';
      fill.style.setProperty('--category-color', color);
      track.append(fill);
      row.append(labelRow, track);
      container.append(row);
    });
  }

  function render(subscriptions, onEdit, onDelete) {
    renderSummary(subscriptions);
    renderSubscriptions(subscriptions, onEdit, onDelete);
    renderCategories(subscriptions);
  }

  window.SubscriptionUI = { render: render };
}());
