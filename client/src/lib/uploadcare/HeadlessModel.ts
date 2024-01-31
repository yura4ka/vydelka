import * as LR from "@uploadcare/blocks";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "lr-headless-modal": CustomElement<
        FileUploaderRegular,
        CtxAttributes & ShadowWrapperAttributes
      >;
    }
  }
}

export default class HeadlessModal extends LR.ShadowWrapper {
  static template = `
    <lr-modal strokes block-body-scrolling>
      <lr-start-from>
        <lr-drop-area with-icon clickable></lr-drop-area>
        <lr-source-list wrap></lr-source-list>
        <button type="button" l10n="start-from-cancel" class="secondary-btn" set="onclick: *historyBack"></button>
        <lr-copyright></lr-copyright>
      </lr-start-from>
      <lr-upload-list></lr-upload-list>
      <lr-url-source></lr-url-source>
      <lr-external-source></lr-external-source>
      <lr-cloud-image-editor-activity></lr-cloud-image-editor-activity>
    </lr-modal>

    <lr-message-box></lr-message-box>
    <lr-progress-bar-common></lr-progress-bar-common>
  `;
}
