import fs from 'fs';

let text = fs.readFileSync('src/components/CentralDashboard.tsx', 'utf-8');

// 1. Add ChevronUp and ChevronDown to imports
text = text.replace('RotateCcw } from \'lucide-react\'', 'RotateCcw, ChevronDown, ChevronUp } from \'lucide-react\'');

// 2. Add state inside RestaurantColumn
text = text.replace(
  "const restDrivers = drivers.filter",
  "const [isLibresCollapsed, setIsLibresCollapsed] = useState(true);\n    const restDrivers = drivers.filter"
);

// 3. Update the Libres section header
const oldLibresHeader = `<div className="bg-green-50 border-b border-green-100 p-4">
              <h3 className="font-semibold text-green-900 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Libres ({free.length})
              </h3>
            </div>`;

const newLibresHeader = `<div 
              className="bg-green-50 border-b border-green-100 p-4 flex items-center justify-between cursor-pointer select-none hover:bg-green-100/50 transition-colors"
              onClick={() => setIsLibresCollapsed(!isLibresCollapsed)}
            >
              <h3 className="font-semibold text-green-900 flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Libres ({free.length})
              </h3>
              <button className="text-green-700 transition-colors">
                {isLibresCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>`;

text = text.split(oldLibresHeader).join(newLibresHeader);

// Now wrap the divide-y div.
const oldDivideY = `<div className="divide-y divide-gray-100">
              {free.length === 0 ? (`;

const newDivideY = `{!isLibresCollapsed && (
            <div className="divide-y divide-gray-100">
              {free.length === 0 ? (`;

text = text.split(oldDivideY).join(newDivideY);

// We need to close the `{!isLibresCollapsed && (`.
// The `divide-y` div ends right before the closing `</div>` of the `rounded-2xl` container for Libres.
// Let's find the closing tags.
// The structure is:
/*
                ))
              )}
            </div>
          </div>
*/
const oldEnd = `                ))
              )}
            </div>
          </div>`;

const newEnd = `                ))
              )}
            </div>
            )}
          </div>`;

text = text.split(oldEnd).join(newEnd);

fs.writeFileSync('src/components/CentralDashboard.tsx', text);
