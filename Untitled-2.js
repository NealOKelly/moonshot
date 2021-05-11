<div id="upload-form-container" class="upload-form-hidden" style="margin-left:30px;margin-right:30px;">
	<br>
	<h1 class="text-center display-4" style="color:#000033;font-size:1.75rem;">Add a document to this folder?</h1>
	<br>
	<form id="upload-form" autocomplete="off">
		<span class="display-4" style="color:#000033;font-size:1.25rem;">File </span><span style="font-size:1rem;">(drag &amp; drop, or browse)</span>		
		
		<div id="drop-zone" style="width:100%;background-color:#555;height:100px;color:#fff;margin-bottom:1rem;" ondrop="dropHandler(event);" ondragover="dragOverHandler(event);">
				<div  id="browse-button-container" style="height:100%;width:100%;">
					<div style="height:100%;width:100%;" class="d-flex align-items-center">
						
						<div style="width:100%;" class="d-flex justify-content-center">
							<div><button id="browse-button" class="btn btn-green" >Browse</button></div>
						</div>

					</div>
				</div>

			<div id="file-details-container" style="height:100%;width:100%;display:none;">
				<div class="d-flex justify-content-end"><span id="x-icon"></span></div>
				<div style="width:100%;height:76%;" class="d-flex align-items-center">
					<div style="width:100%;margin-top:-24px;flex-wrap:wrap;" class="d-flex justify-content-center">
						<div><span id="dropped-file-filetype-icon" class="fiv-viv fiv-icon-blank"></span></div>
						<div style="flex-basis:100%;height:0;"><!-- break --></div>
						<div><span id="dropped-file-name"></span></div>				
					</div>
				</div>
				
				
			</div>
		</div>
		
		
		<div id="upload-form-file-container" class="custom-file mb-3 truncate" style="display: none;">
			<input id="upload-form-file" name="upload" type="file" class="custom-file-input" id="validatedCustomFile">
			<label id="upload-form-file-label" class="custom-file-label" for="upload-form-file">Choose file...</label>
		</div>
		<div class="mb-3">
			<label for="upload-form-record-title" class="display-4" style="color:#000033;font-size:1.25rem;">Record Title</label>
			<input id="upload-form-record-title" class="form-control" type="text" maxlength="254">
		</div>
		<div class="mb-3">
			<label for="upload-form-record-container" class="display-4" style="color:#000033;font-size:1.25rem;">Folder</label>
			<input id="upload-form-record-container" class="form-control" type="text" data-record-uri="" readonly>
		</div>
		<div class="form-group">
		  <label for="upload-form-record-type" class="display-4" style="color:#000033;font-size:1.25rem;">Record Type</label>
		  <select id="upload-form-record-type" class="form-control">
			
		  </select>
		</div>
	</form>

	<br>
	<button id="upload-button" class="btn btn-indigo">Add</button>
</div>		