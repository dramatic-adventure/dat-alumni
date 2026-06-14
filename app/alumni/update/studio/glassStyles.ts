// Shared frosted-glass field styling for the studio editors (story + events).
// Defined as real CSS so ::placeholder / :focus work and it never depends on
// Tailwind JIT. Inject once per view: <style dangerouslySetInnerHTML / {GLASS_CSS}>.

export const glassLabelClass = "dat-glass-label";
export const glassInputClass = "dat-glass-input";
export const glassSelectClass = "dat-glass-input dat-glass-select";

export const GLASS_CSS = `
.dat-glass-label{display:block;margin-bottom:8px;font-size:12px;letter-spacing:.03em;text-transform:uppercase;color:rgba(242,242,242,.6);font-weight:500;}
.dat-glass-input{width:100%;box-sizing:border-box;border-radius:12px;border:1px solid rgba(255,255,255,.15) !important;background-color:rgba(255,255,255,.06) !important;padding:13px 15px;font-size:15px;color:#F2F2F2 !important;outline:none;font-family:inherit;transition:border-color .15s,box-shadow .15s;}
.dat-glass-input::placeholder{color:rgba(242,242,242,.55) !important;}
.dat-glass-input:hover{border-color:rgba(255,255,255,.28) !important;}
.dat-glass-input:focus{border-color:rgba(36,147,169,.75) !important;box-shadow:0 0 0 3px rgba(36,147,169,.25) !important;}
.dat-glass-input option{color:#241123;background:#F2F2F2;}
.dat-glass-textarea{min-height:96px;resize:vertical;line-height:1.5;}
.dat-glass-select{appearance:none;-webkit-appearance:none;padding-right:42px;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='16'%20height='16'%20fill='none'%20stroke='%23F2F2F2'%20stroke-opacity='0.6'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3E%3Cpath%20d='M4%206l4%204%204-4'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 15px center;}
`;
