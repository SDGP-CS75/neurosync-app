import React, { useState } from "react";
import { Portal, Dialog, Button, TextInput } from "react-native-paper";
import { theme } from "../constants/theme";

interface InputDialogProps {
  visible: boolean;
  hideDialog: () => void;
  title: string;
  placeholder?: string;
  onSubmit: (value: string) => void;
}

const InputDialog: React.FC<InputDialogProps> = ({
    visible,
    hideDialog,
    title,
    placeholder,
    onSubmit,
}) => {

    const [text, setText] = useState<string>("");

    const handleSubmit = () => {
        onSubmit(text);
        setText(""); 
        hideDialog();
    };

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={hideDialog}>
            
            <Dialog.Title style={{ color: theme.colors.textMuted }}>{title}</Dialog.Title>

            <Dialog.Content>
                <TextInput
                label={placeholder}
                value={text}
                onChangeText={setText}
                mode="outlined"
                style={{ borderRadius: 30 }}
                />
            </Dialog.Content>

            <Dialog.Actions>
                <Button onPress={hideDialog}>Cancel</Button>
                <Button onPress={handleSubmit}>Submit</Button>
            </Dialog.Actions>

            </Dialog>
        </Portal>
    );
};

export default InputDialog;