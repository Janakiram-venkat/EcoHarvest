import { COMPONENTS, type ComponentId } from '../config/components';

/** Side panel showing the PDF description of the focused unit. */
export class InfoPanel {
  private readonly el: HTMLElement;
  private readonly title: HTMLElement;
  private readonly sub: HTMLElement;
  private readonly body: HTMLElement;

  constructor(onClose: () => void) {
    this.el = document.createElement('aside');
    this.el.className = 'info-panel';
    this.el.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      <div class="eyebrow">Component</div>
      <h2></h2><div class="sub"></div><p></p>`;
    document.body.appendChild(this.el);
    this.title = this.el.querySelector('h2') as HTMLElement;
    this.sub = this.el.querySelector('.sub') as HTMLElement;
    this.body = this.el.querySelector('p') as HTMLElement;
    (this.el.querySelector('.close') as HTMLElement).addEventListener('click', () => {
      this.hide();
      onClose();
    });
  }

  show(id: ComponentId): void {
    const c = COMPONENTS[id];
    this.title.textContent = c.title;
    this.sub.textContent = c.sub;
    this.body.textContent = c.description;
    this.el.classList.add('open');
  }

  hide(): void {
    this.el.classList.remove('open');
  }
}
