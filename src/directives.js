/**
 * Aim
 * use in template:
 * <div jlist="items" jname="item">
 *   <li>{$ index $} - {$ item.name $}</li>
 * </div>
 *
 */

/**
 * Recursive function for map all descendants and replace (*for) cicles with repetitions where items from array will be applied on HTML.
 * @param rootElement The root element
 * @param el The mapped root and its children
 */
// eslint-disable-next-line no-unused-vars
function replace(rootElement, el) {
  el.childNodes.forEach(function (childNode) {
    if (childNode instanceof HTMLElement) {
      var child = childNode;
      if (child.hasAttribute("*for")) {
        var operation = child.getAttribute("*for");
        var itemsCommand = /var (.*) of (.*)/.exec(operation);
        if (itemsCommand?.length === 3) {
          var listName = itemsCommand[2];
          var itemName = itemsCommand[1];

          if (rootElement[listName] && Array.isArray(rootElement[listName])) {
            for (var x = 0; x < rootElement[listName].length; x++) {
              var clone = child.cloneNode(true);
              clone.removeAttribute("*for");
              var htmlParts = clone.innerHTML.split("}}");
              htmlParts.forEach(function (part, i, parts) {
                var position = part.indexOf("{{");

                if (position >= 0) {
                  var pathTovalue = part
                    .substring(position + 2)
                    .replace(/ /g, "");
                  var prefix = part.substring(0, position);

                  var finalValue = "";
                  var replaced = false;

                  if (pathTovalue.indexOf(".") >= 0) {
                    var byPatternSplitted = pathTovalue.split(".");
                    if (byPatternSplitted[0] === itemName) {
                      replaced = true;
                      for (var subpath of byPatternSplitted) {
                        finalValue = item[subpath];
                      }
                    }
                  } else {
                    if (pathTovalue === itemName) {
                      replaced = true;
                      finalValue = item;
                    }
                  }
                  parts[i] = prefix + finalValue;
                }

                return part;
              });

              clone.innerHTML = htmlParts.join("");

              el.append(clone);
            }
          }
        }
        el.removeChild(child);
      }
      replace(rootElement, child);
    }
  });
}
